import { getAuthStatus, getCurrentSession, login as loginApi, logout as logoutApi, changeContext as contextApi, type ContextPair, type Credentials, type SessionSnapshot } from "../api/auth";
import { HttpError } from "../api/http";

export type SessionState =
  | { status: "loading" }
  | { status: "anonymous"; csrfToken?: string }
  | { status: "setup-required"; csrfToken: string }
  | { status: "authenticated"; session: SessionSnapshot }
  | { status: "error"; error: HttpError };

export type AuthMutation =
  | { status: "idle" }
  | { status: "pending"; action: "login" | "logout" | "context" }
  | { status: "error"; action: "login" | "logout" | "context"; error: HttpError };

async function loadSession(signal: AbortSignal): Promise<SessionState> {
  const status = await getAuthStatus({ signal });
  // Um status atrasado não pode iniciar a próxima etapa após unmount/substituição.
  if (signal.aborted) throw new HttpError("ABORT");
  if (status.needsSetup) return { status: "setup-required", csrfToken: status.csrfToken };
  if (!status.authenticated) return { status: "anonymous", csrfToken: status.csrfToken };
  try {
    return { status: "authenticated", session: await getCurrentSession({ signal }) };
  } catch (error: unknown) {
    if (error instanceof HttpError && error.status === 401 && error.code === "INVALID_SESSION") {
      return { status: "anonymous" };
    }
    throw error;
  }
}

export function createSessionLoader(publish: (state: SessionState) => void, publishMutation: (mutation: AuthMutation) => void = () => {}) {
  let generation = 0;
  let controller: AbortController | undefined;
  let state: SessionState = { status: "loading" };
  let pending = false;
  let pendingAction: "login" | "logout" | "context" | undefined;
  let contextUncertain = false;
  // Somente CSRF em memória para revogação explícita; nunca conservar o snapshot ocultado.
  let logoutCsrf: string | undefined;
  const update = (next: SessionState) => {
    state = next;
    if (next.status === "authenticated" || next.status === "anonymous" || next.status === "setup-required") contextUncertain = false;
    if (next.status === "authenticated") logoutCsrf = next.session.csrfToken;
    if (next.status === "anonymous" || next.status === "setup-required") logoutCsrf = undefined;
    publish(next);
  };
  const safeError = (error: unknown) => error instanceof HttpError ? error : new HttpError("INVALID_RESPONSE");

  const invalidate = () => {
    generation++;
    controller?.abort();
    controller = undefined;
  };
  const cancel = () => { invalidate(); pending = false; pendingAction = undefined; logoutCsrf = undefined; contextUncertain = false; };

  const start = () => {
    invalidate();
    const current = generation;
    const request = new AbortController();
    controller = request;
    const isCurrent = () => current === generation && !request.signal.aborted;
    return { current, request, isCurrent };
  };
  const read = async (request: AbortController, isCurrent: () => boolean) => {
    try {
      const next = await loadSession(request.signal);
      if (isCurrent()) update(next);
      return next;
    } catch (error: unknown) {
      const next: SessionState = { status: "error", error: safeError(error) };
      if (isCurrent()) update(next);
      return next;
    }
  };
  const refresh = async () => {
    // Serializar leituras com a escrita em andamento evita ler antes do Set-Cookie.
    if (pending) return;
    const { current, request, isCurrent } = start();
    publishMutation({ status: "idle" });
    // Remove imediatamente o snapshot anterior, inclusive durante refresh que falha.
    update({ status: "loading" });
    await read(request, isCurrent);
    if (current === generation) controller = undefined;
  };
  const mutate = async (action: "login" | "logout", operation: (signal: AbortSignal) => Promise<unknown>) => {
    if (pending) return;
    const { current, request, isCurrent } = start();
    pending = true;
    pendingAction = action;
    publishMutation({ status: "pending", action });
    if (action === "logout") update({ status: "loading" });
    try {
      try { await operation(request.signal); }
      catch (error: unknown) {
        // authenticate() recusa a sessão antes de CSRF: 401 prova que ela não é válida.
        if (!(action === "logout" && error instanceof HttpError && error.status === 401 && error.code === "INVALID_SESSION")) throw error;
      }
      if (!isCurrent()) return;
      update(action === "logout" ? { status: "anonymous" } : { status: "loading" });
      await read(request, isCurrent);
      if (isCurrent()) publishMutation({ status: "idle" });
    } catch (error: unknown) {
      if (isCurrent()) {
        const safe = safeError(error);
        if (action === "logout") update({ status: "error", error: safe });
        publishMutation({ status: "error", action, error: safe });
      }
    } finally {
      if (current === generation) { controller = undefined; pending = false; pendingAction = undefined; }
    }
  };
  const login = async (credentials: Credentials) => {
    if (pending || state.status !== "anonymous" || !state.csrfToken) return;
    const csrf = state.csrfToken;
    await mutate("login", signal => loginApi(credentials, csrf, { signal }));
  };
  const logout = async () => {
    // Logout vence uma troca pendente. Abort não prova rollback: recuperar CSRF
    // pela sessão real antes da revogação, sem publicar snapshot intermediário.
    if (pendingAction === "context" || (!pending && contextUncertain)) {
      invalidate(); pending = false; pendingAction = undefined; logoutCsrf = undefined;
      await mutate("logout", async signal => {
        const latest = await loadSession(signal);
        if (signal.aborted) throw new HttpError("ABORT");
        if (latest.status === "authenticated") await logoutApi(latest.session.csrfToken, { signal });
      });
      return;
    }
    if (pending || !logoutCsrf) return;
    const csrf = logoutCsrf;
    await mutate("logout", signal => logoutApi(csrf, { signal }));
  };
  const changeContext = async (pair: ContextPair) => {
    if (pending || state.status !== "authenticated") return;
    const session = state.session;
    // Resolver somente na lista validada; não confiar no par recebido pela UI.
    const allowed = session.contexts.find(c => c.companyId === pair.companyId && c.unitId === pair.unitId);
    if (!allowed || (session.companyId === allowed.companyId && session.unitId === allowed.unitId)) return;
    const selected = { companyId: allowed.companyId, unitId: allowed.unitId };
    const { current, request, isCurrent } = start();
    pending = true; pendingAction = "context"; contextUncertain = true; logoutCsrf = undefined;
    update({ status: "loading" });
    publishMutation({ status: "pending", action: "context" });
    try {
      let postError: HttpError | undefined;
      try { await contextApi(selected, session.csrfToken, { signal: request.signal }); }
      catch (error: unknown) { postError = safeError(error); }
      if (!isCurrent()) return;
      // Inclusive em timeout/rede/5xx, consultar sem repetir o comando.
      const next = await read(request, isCurrent);
      if (!isCurrent()) return;
      const error = next.status === "error" ? next.error : postError;
      publishMutation(error ? { status: "error", action: "context", error } : { status: "idle" });
    } finally {
      if (current === generation) { controller = undefined; pending = false; pendingAction = undefined; }
    }
  };
  return { refresh, cancel, login, logout, changeContext };
}
