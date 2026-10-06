import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { changeContext } from "./auth";
const fetchMock = vi.fn<typeof fetch>();
const pair = { companyId: "b", unitId: "b1" };
const dto = { user: { id: "u", name: "Pessoa", login: "teste" }, ...pair,
  sessionId: "s", csrfToken: "new-csrf", permissions: [],
  contexts: [{ ...pair, companyName: "Empresa B", unitName: "Unidade B" }] };
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe("POST de contexto pelo transporte oficial", () => {
  it("envia somente IDs no JSON e CSRF atual; projeta resposta sem extras", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ...dto, secret: "não copiar" })));
    await expect(changeContext({ ...pair, companyName: "não enviar" } as typeof pair, "old-csrf")).resolves.toEqual(dto);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/auth/context"); expect(init?.body).toBe(JSON.stringify(pair));
    expect(init?.credentials).toBe("same-origin");
    expect(new Headers(init?.headers).get("X-CSRF-Token")).toBe("old-csrf");
  });
  it.each([{}, { ...dto, companyId: null }, { ...dto, companyId: null, unitId: null }, { ...dto, contexts: [{}] }])("recusa DTO inválido %j", async value => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(value)));
    await expect(changeContext(pair, "csrf")).rejects.toMatchObject({ kind: "INVALID_RESPONSE" });
  });
  it.each([[403, "FORBIDDEN_CONTEXT"], [403, "INVALID_CSRF"], [401, "INVALID_SESSION"], [409, "CONTEXT_CHANGED"], [403, "SCOPE_REQUIRED"], [500, "INTERNAL_ERROR"]])("preserva erro %s/%s sem retry ou mensagem bruta", async (status, code) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ code, error: "conteúdo privado" }), { status: Number(status) }));
    const error = await changeContext(pair, "csrf").catch((e: unknown) => e);
    expect(error).toMatchObject({ code, status }); expect(String(error)).not.toContain("conteúdo privado");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("rede não reenvia comando", async () => {
    fetchMock.mockRejectedValue(new Error("rede"));
    await expect(changeContext(pair, "csrf")).rejects.toMatchObject({ kind: "NETWORK" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("timeout não reenvia comando", async () => {
    vi.useFakeTimers(); fetchMock.mockImplementation((_url, init) => new Promise((_ok, fail) => init?.signal?.addEventListener("abort", () => fail(new Error("abort")))));
    const check = expect(changeContext(pair, "csrf", { timeoutMs: 5 })).rejects.toMatchObject({ kind: "TIMEOUT" });
    await vi.advanceTimersByTimeAsync(5); await check; expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
