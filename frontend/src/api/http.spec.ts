import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { get, HttpError, post } from "./http";

const fetchMock = vi.fn<typeof fetch>();
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status });

function pendingFetch() {
  fetchMock.mockImplementation((_url, init) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
  }));
}

function request() {
  const call = fetchMock.mock.calls[0];
  if (!call?.[1]) throw new Error("A chamada não forneceu opções HTTP.");
  return { url: String(call[0]), init: call[1], headers: new Headers(call[1].headers) };
}

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock.mockReset().mockImplementation(async () => json({ ready: true }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("transporte HTTP da SPA", () => {
  it("GET usa /api/ na origem do documento, cookie e bloqueio de redirecionamento", async () => {
    await get("/api/example");
    expect(request().url).toBe("/api/example");
    expect(request().init).toMatchObject({ method: "GET", credentials: "same-origin", mode: "same-origin", redirect: "error", cache: "no-store" });
    expect(request().init.body).toBeUndefined();
    expect(request().headers.get("Content-Type")).toBeNull();
    expectTypeOf(get).returns.toEqualTypeOf<Promise<unknown>>();
    expectTypeOf(post).returns.toEqualTypeOf<Promise<unknown>>();
  });

  it("query preserva texto como valor sem injetar parâmetros", async () => {
    const q = "café & companyId=outra # + / ?";
    await get("/api/example", { query: { q, page: 2, active: false } });
    const url = new URL(request().url, "http://127.0.0.1:3210");
    expect([...url.searchParams]).toEqual([["q", q], ["page", "2"], ["active", "false"]]);
    expect(url.pathname).toBe("/api/example");
    expect(url.hash).toBe("");
  });

  it("POST serializa JSON explicitamente", async () => {
    const body = { name: "João", amount: 0 };
    await post("/api/example", body);
    expect(request().init.method).toBe("POST");
    expect(request().headers.get("Content-Type")).toBe("application/json");
    expect(request().init.body).toBe(JSON.stringify(body));
  });

  it("CSRF é enviado apenas no POST que o recebeu", async () => {
    await post("/api/example", {}, { csrfToken: "csrf-de-teste" });
    expect(request().headers.get("X-CSRF-Token")).toBe("csrf-de-teste");
    fetchMock.mockClear();
    await post("/api/example", {});
    expect(request().headers.get("X-CSRF-Token")).toBeNull();
    fetchMock.mockClear();
    const extraOptions = { csrfToken: "ignorado-em-GET", timeoutMs: 100 };
    await get("/api/example", extraOptions);
    expect(request().headers.get("X-CSRF-Token")).toBeNull();
  });

  it("company/unit são explícitos e não vazam para a chamada seguinte", async () => {
    await get("/api/example", { context: { companyId: "empresa-a", unitId: "unidade-a" } });
    expect(request().headers.get("X-Company-ID")).toBe("empresa-a");
    expect(request().headers.get("X-Unit-ID")).toBe("unidade-a");
    fetchMock.mockClear();
    await post("/api/example", {}, { context: { companyId: "empresa-b", unitId: "unidade-b" } });
    expect(request().headers.get("X-Company-ID")).toBe("empresa-b");
    expect(request().headers.get("X-Unit-ID")).toBe("unidade-b");
    fetchMock.mockClear();
    await get("/api/example");
    expect(request().headers.get("X-Company-ID")).toBeNull();
    expect(request().headers.get("X-Unit-ID")).toBeNull();
  });

  it.each([null, false, 0, "texto", [1, 2], { items: [] }])("retorna JSON bruto sem fingir validar DTO: %j", async (value) => {
    fetchMock.mockResolvedValue(json(value));
    await expect(get("/api/example")).resolves.toEqual(value);
  });

  it.each([204, 205])("sucesso sem conteúdo %i retorna undefined", async (status) => {
    fetchMock.mockResolvedValue(new Response(null, { status }));
    await expect(post("/api/example", {})).resolves.toBeUndefined();
  });

  it.each([401, 409, 422, 500])("preserva status e code de erro HTTP %i", async (status) => {
    const code = status === 401 ? "INVALID_SESSION" : status === 409 ? "CONTEXT_CHANGED" : "INVALID_QUERY";
    fetchMock.mockResolvedValue(json({ error: "Mensagem do backend", code }, status));
    await expect(get("/api/example")).rejects.toMatchObject({ name: "HttpError", kind: "HTTP", status, code });
  });

  it.each(["<html>Erro em C:\\privado</html>", "", "{invalido", JSON.stringify({ code: 42 }), JSON.stringify({ code: "bad code" })])("erro HTTP com corpo inválido tem mensagem segura: %s", async (body) => {
    fetchMock.mockResolvedValue(new Response(body, { status: 502 }));
    await expect(get("/api/example")).rejects.toMatchObject({ kind: "HTTP", status: 502, code: undefined, message: "Não foi possível concluir a solicitação." });
  });

  it("não expõe corpo, mensagem arbitrária, stack ou caminho do servidor", async () => {
    fetchMock.mockResolvedValue(json({ error: "Senha secreta em C:\\privado", code: "INTERNAL_ERROR", stack: "stack privada" }, 500));
    const error: unknown = await get("/api/example").catch(value => value);
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ kind: "HTTP", status: 500, code: "INTERNAL_ERROR", message: "Não foi possível concluir a solicitação." });
    expect(JSON.stringify(error)).not.toMatch(/secreta|privado|privada/);
  });

  it.each(["<html>sucesso falso</html>", "{invalido", "", " "])('sucesso não JSON é INVALID_RESPONSE: "%s"', async (body) => {
    fetchMock.mockResolvedValue(new Response(body));
    await expect(get("/api/example")).rejects.toMatchObject({ kind: "INVALID_RESPONSE", status: 200, code: undefined });
  });

  it("falha de rede não expõe o erro nativo", async () => {
    fetchMock.mockRejectedValue(new TypeError("DNS privado e secret"));
    await expect(get("/api/example")).rejects.toMatchObject({ kind: "NETWORK", status: undefined, message: "Não foi possível conectar ao servidor." });
  });

  it("timeout padrão é finito, em 15 segundos, e cancela fetch", async () => {
    pendingFetch();
    const result = expect(get("/api/example")).rejects.toMatchObject({ kind: "TIMEOUT" });
    await vi.advanceTimersByTimeAsync(14_999);
    expect(request().init.signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await result;
    expect(request().init.signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("permite prazo explícito e mantém TIMEOUT se chamador cancelar depois", async () => {
    pendingFetch();
    const caller = new AbortController();
    const result = expect(get("/api/example", { timeoutMs: 50, signal: caller.signal })).rejects.toMatchObject({ kind: "TIMEOUT" });
    await vi.advanceTimersByTimeAsync(50);
    caller.abort();
    await result;
  });

  it("cancelamento do chamador é ABORT, sem esperar timeout", async () => {
    pendingFetch();
    const caller = new AbortController();
    const result = expect(get("/api/example", { signal: caller.signal })).rejects.toMatchObject({ kind: "ABORT" });
    caller.abort(new Error("motivo privado"));
    await result;
    expect(request().init.signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("signal já cancelado não inicia fetch", async () => {
    const caller = new AbortController();
    caller.abort();
    await expect(get("/api/example", { signal: caller.signal })).rejects.toMatchObject({ kind: "ABORT" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("prazo cobre também a leitura do corpo após receber status", async () => {
    fetchMock.mockImplementation(async (_url, init) => new Response(new ReadableStream({
      start(controller) { init?.signal?.addEventListener("abort", () => controller.error(init.signal?.reason), { once: true }); },
    })));
    const result = expect(get("/api/example", { timeoutMs: 20 })).rejects.toMatchObject({ kind: "TIMEOUT", status: 200 });
    await vi.advanceTimersByTimeAsync(20);
    await result;
  });

  it.each(["success", "http", "invalid", "network"])("limpa timer/listener após %s", async (outcome) => {
    const caller = new AbortController();
    const remove = vi.spyOn(caller.signal, "removeEventListener");
    if (outcome === "http") fetchMock.mockResolvedValue(json({ code: "FORBIDDEN" }, 403));
    if (outcome === "invalid") fetchMock.mockResolvedValue(new Response("invalid"));
    if (outcome === "network") fetchMock.mockRejectedValue(new TypeError());
    await get("/api/example", { signal: caller.signal }).catch(() => undefined);
    expect(vi.getTimerCount()).toBe(0);
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
    caller.abort();
    await vi.advanceTimersByTimeAsync(15_000);
    expect(request().init.signal?.aborted).toBe(false);
  });

  it.each(["GET", "POST"].flatMap(method => ["network", "http"].map(failure => ({ method, failure }))))("não repete $method após $failure", async ({ method, failure }) => {
    if (failure === "network") fetchMock.mockRejectedValue(new TypeError());
    else fetchMock.mockResolvedValue(json({ code: "INTERNAL_ERROR" }, 500));
    await (method === "GET" ? get("/api/example") : post("/api/example", {})).catch(() => undefined);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(["https://externo.example/api/example", "//externo.example/api/example", "/fora", "/api", "/api/../fora", "/api/%2e%2e/fora", "/api/example?x=1", "/api/example#x", "/api/\\externo", "/api/example\n", "/api//example"])("rejeita destino arbitrário: %s", async (path) => {
    await expect(post(path, { privateData: true })).rejects.toBeInstanceOf(TypeError);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([0, -1, Infinity, NaN, 0.5, 2_147_483_648])("rejeita timeout não finito/representável: %s", async (timeoutMs) => {
    await expect(get("/api/example", { timeoutMs })).rejects.toBeInstanceOf(TypeError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([undefined, 1n])("não envia corpo não serializável: %s", async (body) => {
    await expect(post("/api/example", body)).rejects.toBeInstanceOf(TypeError);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
