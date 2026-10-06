import { get, post, HttpError, type RequestOptions } from "./http";

export interface Credentials { readonly login: string; readonly password: string }
export interface ContextPair { readonly companyId: string; readonly unitId: string }

export interface AuthStatus {
  readonly needsSetup: boolean;
  readonly authenticated: boolean;
  readonly csrfToken: string;
}

export interface SessionSnapshot {
  readonly user: Readonly<{ id: string; name: string; login: string }>;
  readonly companyId: string | null;
  readonly unitId: string | null;
  readonly sessionId: string;
  readonly csrfToken: string;
  readonly permissions: readonly string[];
  readonly contexts: readonly Readonly<{
    companyId: string; companyName: string; unitId: string; unitName: string;
  }>[];
}

type AuthOptions = Pick<RequestOptions, "signal" | "timeoutMs">;

function invalid(): never { throw new HttpError("INVALID_RESPONSE", 200); }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function object(value: unknown): Record<string, unknown> {
  return isObject(value) ? value : invalid();
}

function text(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") return invalid();
  return value;
}

function nullableId(value: unknown): string | null {
  return value === null ? null : text(value);
}

export async function getAuthStatus(options: AuthOptions = {}): Promise<AuthStatus> {
  const data = object(await get("/api/auth/status", options));
  if (typeof data.needsSetup !== "boolean" || typeof data.authenticated !== "boolean") return invalid();
  return { needsSetup: data.needsSetup, authenticated: data.authenticated, csrfToken: text(data.csrfToken) };
}

export async function getCurrentSession(options: AuthOptions = {}): Promise<SessionSnapshot> {
  return sessionSnapshot(await get("/api/auth/me", options));
}

function sessionSnapshot(value: unknown): SessionSnapshot {
  const data = object(value);
  const user = object(data.user);
  const companyId = nullableId(data.companyId), unitId = nullableId(data.unitId);
  if ((companyId === null) !== (unitId === null)) return invalid();
  if (!Array.isArray(data.permissions) || !Array.isArray(data.contexts)) return invalid();
  // Projetar somente campos usados; nenhum cast de unknown para DTO ou cópia de extras.
  return {
    user: { id: text(user.id), name: text(user.name), login: text(user.login) },
    companyId, unitId, sessionId: text(data.sessionId), csrfToken: text(data.csrfToken),
    permissions: data.permissions.map(text),
    contexts: data.contexts.map((value: unknown) => {
      const context = object(value);
      return {
        companyId: text(context.companyId), companyName: text(context.companyName),
        unitId: text(context.unitId), unitName: text(context.unitName),
      };
    }),
  };
}

export async function login(credentials: Credentials, csrfToken: string, options: AuthOptions = {}): Promise<SessionSnapshot> {
  return sessionSnapshot(await post("/api/auth/login", {
    login: credentials.login, password: credentials.password,
  }, { ...options, csrfToken }));
}

export async function logout(csrfToken: string, options: AuthOptions = {}): Promise<{ loggedOut: true }> {
  const data = object(await post("/api/auth/logout", {}, { ...options, csrfToken }));
  if (data.loggedOut !== true) return invalid();
  return { loggedOut: true };
}

export async function changeContext(pair: ContextPair, csrfToken: string, options: AuthOptions = {}): Promise<SessionSnapshot> {
  const session = sessionSnapshot(await post("/api/auth/context", {
    companyId: pair.companyId, unitId: pair.unitId,
  }, { ...options, csrfToken }));
  if (session.companyId === null || session.unitId === null) return invalid();
  return session;
}
