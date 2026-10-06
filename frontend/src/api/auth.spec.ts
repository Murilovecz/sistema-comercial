import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthStatus, getCurrentSession } from "./auth";

const fetchMock = vi.fn<typeof fetch>();
const status = { needsSetup: false, authenticated: false, csrfToken: "csrf-sintetico" };
const session = {
  user: { id: "pessoa-a", name: "Pessoa sintética", login: "teste" },
  companyId: "empresa-a", unitId: "unidade-a", sessionId: "sessao-sintetica",
  permissions: ["catalog.view", "future.permission"], csrfToken: "csrf-sessao",
  contexts: [{ companyId: "empresa-a", companyName: "Empresa A", unitId: "unidade-a", unitName: "Unidade A" }],
};

beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
afterEach(() => { vi.unstubAllGlobals(); });
const respond = (value: unknown) => fetchMock.mockResolvedValue(new Response(JSON.stringify(value)));

describe("contratos reais de leitura de autenticação", () => {
  it.each([
    status, { ...status, authenticated: true }, { ...status, needsSetup: true },
  ])("aceita status válido: %j", async (dto) => {
    respond(dto);
    await expect(getAuthStatus()).resolves.toEqual(dto);
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/status", expect.objectContaining({ method: "GET", credentials: "same-origin" }));
  });

  it.each([
    null, [], { ...status, authenticated: "false" }, { ...status, needsSetup: undefined },
    { ...status, csrfToken: null }, { ...status, csrfToken: "" },
  ].map(dto => ({ dto })))("recusa DTO de status inválido: %j", async ({ dto }) => {
    respond(dto);
    await expect(getAuthStatus()).rejects.toMatchObject({ kind: "INVALID_RESPONSE", status: 200 });
  });

  it("valida me, preserva permissões/contexto e ignora campos adicionais", async () => {
    respond({ ...session, privateExtra: "não-projetar", user: { ...session.user, extra: true } });
    const signal = new AbortController().signal;
    await expect(getCurrentSession({ signal })).resolves.toEqual(session);
    const init = fetchMock.mock.calls[0]?.[1];
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/auth/me");
    expect(new Headers(init?.headers).get("X-Company-ID")).toBeNull();
    expect(new Headers(init?.headers).get("X-CSRF-Token")).toBeNull();
  });

  it("aceita sessão sem escopo selecionado, sem inventar contexto", async () => {
    const dto = { ...session, companyId: null, unitId: null, permissions: [], contexts: [] };
    respond(dto);
    await expect(getCurrentSession()).resolves.toEqual(dto);
  });

  it.each([
    { ...session, user: null }, { ...session, user: { ...session.user, id: "" } },
    { ...session, sessionId: undefined }, { ...session, csrfToken: null },
    { ...session, companyId: undefined }, { ...session, unitId: 10 },
    { ...session, companyId: null }, { ...session, permissions: "catalog.view" },
    { ...session, permissions: ["catalog.view", null] }, { ...session, contexts: null },
    { ...session, contexts: [null] }, { ...session, contexts: [{ companyId: "empresa-a" }] },
  ])("recusa fronteira inválida em me: %j", async (dto) => {
    respond(dto);
    await expect(getCurrentSession()).rejects.toMatchObject({ kind: "INVALID_RESPONSE", status: 200 });
  });

  it("preserva 401 INVALID_SESSION para decisão do carregador", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: "Entre novamente", code: "INVALID_SESSION" }), { status: 401 }));
    await expect(getCurrentSession()).rejects.toMatchObject({ kind: "HTTP", status: 401, code: "INVALID_SESSION" });
  });
});
