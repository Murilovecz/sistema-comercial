import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { login, logout } from "./auth";

const fetchMock = vi.fn<typeof fetch>();
const credentials = { login: "teste", password: "Senha exclusivamente sintética!" };
const dto = { user: { id: "u", name: "Pessoa", login: "teste" }, companyId: null, unitId: null,
  sessionId: "s", csrfToken: "csrf-sessao", permissions: [], contexts: [] };
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
const respond = (value: unknown) => fetchMock.mockResolvedValue(new Response(JSON.stringify(value)));

describe("mutações reais de autenticação", () => {
  it("login envia somente credenciais no JSON e CSRF pré-login no header", async () => {
    respond({ ...dto, extra: "privado" });
    await expect(login(credentials, "preauth")).resolves.toEqual(dto);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/auth/login");
    expect(init).toMatchObject({ method: "POST", body: JSON.stringify(credentials), credentials: "same-origin" });
    expect(new Headers(init?.headers).get("X-CSRF-Token")).toBe("preauth");
    expect(JSON.stringify([...new Headers(init?.headers)])).not.toContain(credentials.password);
    expect(new Headers(init?.headers).has("X-Company-ID")).toBe(false);
  });
  it("logout envia corpo vazio e CSRF da sessão, sem apagar storage", async () => {
    const storage = { clear: vi.fn(), removeItem: vi.fn() };
    vi.stubGlobal("localStorage", storage); vi.stubGlobal("sessionStorage", storage);
    respond({ loggedOut: true, ignored: "extra" });
    await expect(logout("session-csrf")).resolves.toEqual({ loggedOut: true });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/auth/logout");
    expect(init).toMatchObject({ method: "POST", body: "{}" });
    expect(new Headers(init?.headers).get("X-CSRF-Token")).toBe("session-csrf");
    expect(storage.clear).not.toHaveBeenCalled(); expect(storage.removeItem).not.toHaveBeenCalled();
  });
  it.each([null, {}, { ...dto, user: null }, { ...dto, companyId: "c" }])("recusa login com DTO inválido: %j", async value => {
    respond(value); await expect(login(credentials, "csrf")).rejects.toMatchObject({ kind: "INVALID_RESPONSE" });
  });
  it.each([null, {}, { loggedOut: false }, { loggedOut: "true" }])("recusa logout sem confirmação: %j", async value => {
    respond(value); await expect(logout("csrf")).rejects.toMatchObject({ kind: "INVALID_RESPONSE" });
  });
  it.each(["INVALID_CREDENTIALS", "INVALID_CSRF", "AUTH_RATE_LIMIT", "AUTH_BUSY", "INVALID_SESSION"])("preserva %s sem corpo bruto ou retry", async code => {
    const status = code.startsWith("AUTH_") ? 429 : code === "INVALID_CSRF" ? 403 : 401;
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ code, error: credentials.password }), { status }));
    const error = await login(credentials, "csrf").catch((e: unknown) => e);
    expect(error).toMatchObject({ code, status });
    expect(String(error)).not.toContain(credentials.password); expect(JSON.stringify(error)).not.toContain(credentials.password);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each(["login", "logout"] as const)("%s falha de rede não vira sucesso", async action => {
    fetchMock.mockRejectedValue(new Error(credentials.password));
    await expect(action === "login" ? login(credentials, "csrf") : logout("csrf")).rejects.toMatchObject({ kind: "NETWORK" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each(["login", "logout"] as const)("%s timeout não vira sucesso nem retry", async action => {
    vi.useFakeTimers();
    fetchMock.mockImplementation((_url, init) => new Promise((_ok, fail) => init?.signal?.addEventListener("abort", () => fail(new Error("cancelado")))));
    const request = action === "login" ? login(credentials, "csrf", { timeoutMs: 5 }) : logout("csrf", { timeoutMs: 5 });
    const check = expect(request).rejects.toMatchObject({ kind: "TIMEOUT" });
    await vi.advanceTimersByTimeAsync(5); await check;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
