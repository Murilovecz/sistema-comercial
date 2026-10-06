import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthStatus, getCurrentSession, changeContext, logout, type SessionSnapshot } from "../api/auth";
import { HttpError } from "../api/http";
import { createSessionLoader, type SessionState, type AuthMutation } from "./session";
vi.mock("../api/auth", () => ({ getAuthStatus: vi.fn(), getCurrentSession: vi.fn(), changeContext: vi.fn(), logout: vi.fn(), login: vi.fn() }));
const statusMock = vi.mocked(getAuthStatus), meMock = vi.mocked(getCurrentSession), changeMock = vi.mocked(changeContext), logoutMock = vi.mocked(logout);
const a = { companyId: "a", unitId: "a1", companyName: "Empresa A", unitName: "Unidade A" };
const b = { companyId: "b", unitId: "b1", companyName: "Empresa B", unitName: "Unidade B" };
const base: SessionSnapshot = { user: { id: "u", name: "Pessoa", login: "teste" }, companyId: a.companyId, unitId: a.unitId,
  sessionId: "s", csrfToken: "csrf-a", permissions: ["catalog.view"], contexts: [a, b] };
const next: SessionSnapshot = { ...base, companyId: b.companyId, unitId: b.unitId, csrfToken: "csrf-b", permissions: [], contexts: [b] };
const status = { needsSetup: false, authenticated: true, csrfToken: "status" };
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(ok => { resolve = ok; }); return { promise, resolve }; }
async function fixture(snapshot = base) { const states: SessionState[] = [], mutations: AuthMutation[] = [];
  meMock.mockResolvedValue(snapshot); const loader = createSessionLoader(s => states.push(s), m => mutations.push(m)); await loader.refresh(); return { states, mutations, loader }; }
beforeEach(() => { statusMock.mockReset().mockResolvedValue(status); meMock.mockReset().mockResolvedValue(base);
  changeMock.mockReset().mockResolvedValue(next); logoutMock.mockReset().mockResolvedValue({ loggedOut: true }); });
describe("seleção e reconciliação de contexto", () => {
  it("barreira oculta snapshot antes do POST e publica somente me com direitos/lista/CSRF novos", async () => {
    const f = await fixture(), post = deferred<SessionSnapshot>(); changeMock.mockReturnValue(post.promise);
    const task = f.loader.changeContext(b); expect(f.states.at(-1)?.status).toBe("loading");
    expect(f.mutations.at(-1)).toEqual({ status: "pending", action: "context" });
    expect(changeMock).toHaveBeenCalledWith({ companyId: "b", unitId: "b1" }, "csrf-a", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    meMock.mockResolvedValue(next); post.resolve({ ...next, permissions: ["inventada"], csrfToken: "body" }); await task;
    expect(f.states.at(-1)).toEqual({ status: "authenticated", session: next }); expect(f.mutations.at(-1)).toEqual({ status: "idle" });
  });
  it("múltiplas opções com contexto null aguardam escolha explícita", async () => {
    const f = await fixture({ ...base, companyId: null, unitId: null }); expect(changeMock).not.toHaveBeenCalled();
    meMock.mockResolvedValue(next); await f.loader.changeContext(b); expect(changeMock).toHaveBeenCalledTimes(1);
    expect(f.states.at(-1)).toEqual({ status: "authenticated", session: next });
  });
  it("mesmo contexto é no-op; par cruzado ou não permitido não envia POST", async () => {
    const f = await fixture(); await f.loader.changeContext(a);
    await f.loader.changeContext({ companyId: "a", unitId: "b1" }); await f.loader.changeContext({ companyId: "externa", unitId: "externa" });
    expect(changeMock).not.toHaveBeenCalled(); expect(f.states.at(-1)).toEqual({ status: "authenticated", session: base });
  });
  it.each(["FORBIDDEN_CONTEXT", "INVALID_CSRF", "CONTEXT_CHANGED", "SCOPE_REQUIRED"])("%s relê lista/contexto sem repetir POST", async code => {
    const f = await fixture(); const error = new HttpError("HTTP", code === "CONTEXT_CHANGED" ? 409 : 403, code);
    changeMock.mockRejectedValue(error); meMock.mockResolvedValue({ ...base, contexts: [a] }); await f.loader.changeContext(b);
    expect(f.states.at(-1)).toEqual({ status: "authenticated", session: { ...base, contexts: [a] } });
    expect(f.mutations.at(-1)).toEqual({ status: "error", action: "context", error }); expect(changeMock).toHaveBeenCalledTimes(1);
  });
  it("INVALID_SESSION converge para anonymous sem contexto antigo", async () => {
    const f = await fixture(); changeMock.mockRejectedValue(new HttpError("HTTP", 401, "INVALID_SESSION"));
    statusMock.mockResolvedValue({ ...status, authenticated: false }); await f.loader.changeContext(b);
    expect(f.states.at(-1)).toEqual({ status: "anonymous", csrfToken: "status" }); expect(meMock).toHaveBeenCalledTimes(1);
  });
  it.each(["NETWORK", "TIMEOUT"] as const)("%s ambíguo reconcilia para novo ou antigo somente por leitura", async kind => {
    for (const observed of [next, base]) {
      const f = await fixture(); changeMock.mockClear().mockRejectedValue(new HttpError(kind)); meMock.mockResolvedValue(observed);
      await f.loader.changeContext(b); expect(f.states.at(-1)).toEqual({ status: "authenticated", session: observed });
      expect(changeMock).toHaveBeenCalledTimes(1); expect(f.mutations.at(-1)).toMatchObject({ status: "error", action: "context" });
    }
  });
  it.each([new HttpError("NETWORK"), new HttpError("TIMEOUT"), new HttpError("HTTP", 500, "INTERNAL_ERROR"), undefined])("releitura impossível não fabrica snapshot: %j", async postError => {
    const f = await fixture(); if (postError) changeMock.mockRejectedValue(postError);
    statusMock.mockRejectedValue(new HttpError("NETWORK")); await f.loader.changeContext(b);
    expect(f.states.at(-1)).toMatchObject({ status: "error" }); expect(f.mutations.at(-1)).toMatchObject({ status: "error", action: "context" });
    await f.loader.changeContext(a); expect(changeMock).toHaveBeenCalledTimes(1);
  });
  it("duplo submit e refresh durante troca são bloqueados; próxima troca usa novo CSRF", async () => {
    const f = await fixture(), post = deferred<SessionSnapshot>(); changeMock.mockReturnValueOnce(post.promise);
    const task = f.loader.changeContext(b); await f.loader.changeContext(b); await f.loader.refresh(); expect(changeMock).toHaveBeenCalledTimes(1);
    meMock.mockResolvedValue({ ...next, contexts: [a, b] }); post.resolve(next); await task;
    meMock.mockResolvedValue(base); await f.loader.changeContext(a);
    expect(changeMock.mock.calls[1]?.[1]).toBe("csrf-b"); expect(f.states.at(-1)).toEqual({ status: "authenticated", session: base });
  });
  it("resposta me anterior atrasada não sobrescreve troca", async () => {
    const f = await fixture(), old = deferred<SessionSnapshot>(); meMock.mockReturnValueOnce(old.promise);
    const refresh = f.loader.refresh(); await vi.waitFor(() => expect(meMock).toHaveBeenCalledTimes(2));
    // Refresh esconde o snapshot: terminar uma leitura válida antes de trocar.
    await f.loader.refresh(); meMock.mockResolvedValue(next); await f.loader.changeContext(b);
    const count = f.states.length; old.resolve(base); await refresh; expect(f.states.length).toBe(count);
    expect(f.states.at(-1)).toEqual({ status: "authenticated", session: next });
  });
  it("logout vence troca pendente, relê CSRF e descarta resposta tardia", async () => {
    const f = await fixture(), post = deferred<SessionSnapshot>(); changeMock.mockReturnValue(post.promise);
    const change = f.loader.changeContext(b); meMock.mockResolvedValue(next);
    logoutMock.mockImplementation(async () => { statusMock.mockResolvedValue({ ...status, authenticated: false }); return { loggedOut: true }; });
    await f.loader.logout(); expect(logoutMock).toHaveBeenCalledWith("csrf-b", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    const count = f.states.length; post.resolve(next); await change; expect(f.states.length).toBe(count);
    expect(f.states.at(-1)?.status).toBe("anonymous"); expect(f.mutations.at(-1)).toEqual({ status: "idle" });
  });
  it("logout durante reconciliação descarta me antigo mesmo após retorno do POST", async () => {
    const f = await fixture(), old = deferred<SessionSnapshot>(); meMock.mockReturnValueOnce(old.promise);
    const change = f.loader.changeContext(b); await vi.waitFor(() => expect(meMock).toHaveBeenCalledTimes(2));
    meMock.mockResolvedValue(next);
    logoutMock.mockImplementation(async () => { statusMock.mockResolvedValue({ ...status, authenticated: false }); return { loggedOut: true }; });
    await f.loader.logout(); const count = f.states.length; old.resolve(next); await change;
    expect(f.states.length).toBe(count); expect(f.states.at(-1)?.status).toBe("anonymous");
  });
  it("logout sem conseguir recuperar CSRF depois de troca não envia revogação com token antigo", async () => {
    const f = await fixture(), post = deferred<SessionSnapshot>(); changeMock.mockReturnValue(post.promise);
    const change = f.loader.changeContext(b); statusMock.mockRejectedValue(new HttpError("NETWORK")); await f.loader.logout();
    expect(logoutMock).not.toHaveBeenCalled(); expect(f.states.at(-1)).toMatchObject({ status: "error" });
    expect(f.mutations.at(-1)).toMatchObject({ status: "error", action: "logout" });
    post.resolve(next); await change; expect(f.states.at(-1)).toMatchObject({ status: "error" });
  });
});
