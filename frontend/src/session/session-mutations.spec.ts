import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthStatus, getCurrentSession, login, logout } from "../api/auth";
import { HttpError } from "../api/http";
import { createSessionLoader, type SessionState, type AuthMutation } from "./session";
vi.mock("../api/auth", () => ({ getAuthStatus: vi.fn(), getCurrentSession: vi.fn(), login: vi.fn(), logout: vi.fn() }));
const statusMock = vi.mocked(getAuthStatus), meMock = vi.mocked(getCurrentSession);
const loginMock = vi.mocked(login), logoutMock = vi.mocked(logout);
const anonymous = { needsSetup: false, authenticated: false, csrfToken: "preauth" };
const session = { user: { id: "u", name: "Servidor", login: "teste" }, companyId: null, unitId: null,
  sessionId: "s", csrfToken: "session-csrf", permissions: [], contexts: [] };
const credentials = { login: "teste", password: "Somente teste sintético" };
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail; }); return { promise, resolve, reject }; }
function observe() { const states: SessionState[] = [], mutations: AuthMutation[] = [];
  const loader = createSessionLoader(s => states.push(s), m => mutations.push(m)); return { loader, states, mutations }; }
beforeEach(() => { statusMock.mockReset().mockResolvedValue(anonymous); meMock.mockReset().mockResolvedValue(session);
  loginMock.mockReset().mockResolvedValue(session); logoutMock.mockReset().mockResolvedValue({ loggedOut: true }); });
async function authenticated() { const f = observe(); statusMock.mockResolvedValueOnce({ ...anonymous, authenticated: true }); await f.loader.refresh(); return f; }

describe("ciclo coordenado de login/logout", () => {
  it("login usa CSRF pré-login e me autoritativo, inclusive contexto null", async () => {
    const f = observe(); await f.loader.refresh();
    loginMock.mockResolvedValue({ ...session, user: { ...session.user, name: "Body não autoritativo" } });
    statusMock.mockResolvedValue({ ...anonymous, authenticated: true }); await f.loader.login(credentials);
    expect(loginMock).toHaveBeenCalledWith(credentials, "preauth", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(f.states.at(-1)).toEqual({ status: "authenticated", session });
    expect(f.mutations.at(-1)).toEqual({ status: "idle" }); expect(meMock).toHaveBeenCalledTimes(1);
  });
  it.each(["INVALID_CREDENTIALS", "INVALID_CSRF", "AUTH_RATE_LIMIT", "AUTH_BUSY", "INVALID_SESSION"])("login %s mantém erro específico sem retry", async code => {
    const f = observe(); await f.loader.refresh(); const error = new HttpError("HTTP", 401, code); loginMock.mockRejectedValue(error);
    await f.loader.login(credentials); expect(f.states.at(-1)).toEqual({ status: "anonymous", csrfToken: "preauth" });
    expect(f.mutations.at(-1)).toEqual({ status: "error", action: "login", error }); expect(loginMock).toHaveBeenCalledTimes(1);
  });
  it.each([new HttpError("NETWORK"), new HttpError("TIMEOUT")])("login %j conserva distinção sem autenticar", async error => {
    const f = observe(); await f.loader.refresh(); loginMock.mockRejectedValue(error); await f.loader.login(credentials);
    expect(f.mutations.at(-1)).toMatchObject({ status: "error", action: "login", error }); expect(meMock).not.toHaveBeenCalled();
  });
  it("sem CSRF ou durante setup não envia credenciais", async () => {
    const f = observe(); await f.loader.login(credentials); expect(loginMock).not.toHaveBeenCalled();
    statusMock.mockResolvedValue({ ...anonymous, needsSetup: true }); await f.loader.refresh(); await f.loader.login(credentials);
    expect(loginMock).not.toHaveBeenCalled();
  });
  it("duplo submit e refresh durante mutação não geram escritas concorrentes", async () => {
    const f = observe(); await f.loader.refresh(); const pending = deferred<typeof session>(); loginMock.mockReturnValue(pending.promise);
    const first = f.loader.login(credentials); await f.loader.login(credentials); await f.loader.refresh();
    expect(loginMock).toHaveBeenCalledTimes(1); expect(statusMock).toHaveBeenCalledTimes(1);
    statusMock.mockResolvedValue({ ...anonymous, authenticated: true }); pending.resolve(session); await first;
    expect(f.states.at(-1)).toEqual({ status: "authenticated", session });
  });
  it("logout usa CSRF da sessão e esconde snapshot imediatamente", async () => {
    const f = await authenticated(); const pending = deferred<{ loggedOut: true }>(); logoutMock.mockReturnValue(pending.promise);
    const task = f.loader.logout(); expect(f.states.at(-1)).toEqual({ status: "loading" });
    expect(logoutMock).toHaveBeenCalledWith("session-csrf", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    pending.resolve({ loggedOut: true }); await task; expect(f.states.at(-1)).toEqual({ status: "anonymous", csrfToken: "preauth" });
  });
  it("INVALID_SESSION no logout converge sem recuperar snapshot antigo", async () => {
    const f = await authenticated(); logoutMock.mockRejectedValue(new HttpError("HTTP", 401, "INVALID_SESSION")); await f.loader.logout();
    expect(f.states.at(-1)).toEqual({ status: "anonymous", csrfToken: "preauth" }); expect(f.mutations.at(-1)).toEqual({ status: "idle" });
  });
  it.each([new HttpError("NETWORK"), new HttpError("TIMEOUT"), new HttpError("HTTP", 403, "INVALID_CSRF")])("logout %j não confirma saída e permite tentativa explícita", async error => {
    const f = await authenticated(); logoutMock.mockRejectedValueOnce(error); await f.loader.logout();
    expect(f.states.at(-1)).toEqual({ status: "error", error }); expect(f.mutations.at(-1)).toEqual({ status: "error", action: "logout", error });
    expect(statusMock).toHaveBeenCalledTimes(1); await f.loader.logout(); expect(logoutMock).toHaveBeenCalledTimes(2);
    expect(f.states.at(-1)).toEqual({ status: "anonymous", csrfToken: "preauth" });
  });
  it("refresh anterior atrasado não reaparece após logout", async () => {
    const f = await authenticated(), old = deferred<typeof session>(); meMock.mockReturnValueOnce(old.promise);
    statusMock.mockResolvedValueOnce({ ...anonymous, authenticated: true }); const refresh = f.loader.refresh();
    await vi.waitFor(() => expect(meMock).toHaveBeenCalledTimes(2));
    // A sessão já foi retirada da UI; logout conserva somente o CSRF para revogação.
    await f.loader.logout(); const count = f.states.length; old.resolve(session); await refresh;
    expect(f.states.length).toBe(count); expect(f.states.at(-1)?.status).toBe("anonymous");
  });
  it("cancel/unmount durante login não inicia refresh nem publica resposta tardia", async () => {
    const f = observe(); await f.loader.refresh(); const old = deferred<typeof session>(); loginMock.mockReturnValue(old.promise);
    const task = f.loader.login(credentials); f.loader.cancel(); old.resolve(session); await task;
    expect(statusMock).toHaveBeenCalledTimes(1); expect(meMock).not.toHaveBeenCalled();
  });
});
