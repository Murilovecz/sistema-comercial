import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthStatus, getCurrentSession } from "../api/auth";
import { HttpError } from "../api/http";
import { createSessionLoader, type SessionState } from "./session";

vi.mock("../api/auth", () => ({ getAuthStatus: vi.fn(), getCurrentSession: vi.fn() }));
const statusMock = vi.mocked(getAuthStatus);
const meMock = vi.mocked(getCurrentSession);
const status = { needsSetup: false, authenticated: true, csrfToken: "csrf-status" };
const session = {
  user: { id: "pessoa-a", name: "Pessoa A", login: "teste" },
  companyId: "empresa-a", unitId: "unidade-a", sessionId: "sessao-a",
  csrfToken: "csrf-me", permissions: ["catalog.view"],
  contexts: [{ companyId: "empresa-a", companyName: "Empresa A", unitId: "unidade-a", unitName: "Unidade A" }],
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}
function observe() {
  const states: SessionState[] = [];
  const loader = createSessionLoader(state => states.push(state));
  return { states, loader };
}
beforeEach(() => {
  statusMock.mockReset().mockResolvedValue(status);
  meMock.mockReset().mockResolvedValue(session);
});

describe("bootstrap e ciclo de sessão", () => {
  it("consulta status antes de me e publica snapshot validado", async () => {
    const { states, loader } = observe();
    await loader.refresh();
    expect(states).toEqual([{ status: "loading" }, { status: "authenticated", session }]);
    expect(statusMock.mock.invocationCallOrder[0]).toBeLessThan(meMock.mock.invocationCallOrder[0]);
    expect(statusMock).toHaveBeenCalledTimes(1);
    expect(meMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    { dto: { ...status, authenticated: false }, expected: "anonymous" },
    { dto: { ...status, needsSetup: true, authenticated: false }, expected: "setup-required" },
  ])("$expected não consulta me", async ({ dto, expected }) => {
    statusMock.mockResolvedValue(dto);
    const { states, loader } = observe();
    await loader.refresh();
    expect(states.at(-1)).toEqual({ status: expected, csrfToken: dto.csrfToken });
    expect(meMock).not.toHaveBeenCalled();
  });

  it("401 INVALID_SESSION em me limpa snapshot anterior e token da sessão", async () => {
    const { states, loader } = observe();
    await loader.refresh();
    meMock.mockRejectedValue(new HttpError("HTTP", 401, "INVALID_SESSION"));
    await loader.refresh();
    expect(states.slice(-2)).toEqual([{ status: "loading" }, { status: "anonymous" }]);
  });

  it.each([
    new HttpError("NETWORK"), new HttpError("TIMEOUT"), new HttpError("INVALID_RESPONSE", 200),
    new HttpError("HTTP", 403, "FORBIDDEN"), new HttpError("HTTP", 401, "OUTRO_CODIGO"),
  ])("falha em me é erro próprio e não anonymous: %j", async (error) => {
    const { states, loader } = observe();
    await loader.refresh();
    meMock.mockRejectedValue(error);
    await loader.refresh();
    expect(states.slice(-2)).toEqual([{ status: "loading" }, { status: "error", error }]);
    expect(meMock).toHaveBeenCalledTimes(2);
  });

  it("status inválido impede me e não repete consulta", async () => {
    statusMock.mockRejectedValue(new HttpError("INVALID_RESPONSE", 200));
    const { states, loader } = observe();
    await loader.refresh();
    expect(states.at(-1)).toMatchObject({ status: "error", error: { kind: "INVALID_RESPONSE" } });
    expect(meMock).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledTimes(1);
  });

  it("refresh cancela anterior e descarta sucesso de me que ignora abort", async () => {
    const old = deferred<typeof session>();
    meMock.mockImplementationOnce(() => old.promise);
    const { states, loader } = observe();
    const first = loader.refresh();
    await vi.waitFor(() => expect(meMock).toHaveBeenCalledTimes(1));
    const firstSignal = meMock.mock.calls[0]?.[0]?.signal;
    const next = { ...session, user: { ...session.user, name: "Pessoa B" }, companyId: "empresa-b", unitId: "unidade-b" };
    meMock.mockResolvedValue(next);
    await loader.refresh();
    expect(firstSignal?.aborted).toBe(true);
    old.resolve(session);
    await first;
    expect(states).toEqual([{ status: "loading" }, { status: "loading" }, { status: "authenticated", session: next }]);
  });

  it("erro atrasado não substitui resultado do refresh novo", async () => {
    const old = deferred<typeof session>();
    meMock.mockImplementationOnce(() => old.promise);
    const { states, loader } = observe();
    const first = loader.refresh();
    await vi.waitFor(() => expect(meMock).toHaveBeenCalledTimes(1));
    await loader.refresh();
    old.reject(new HttpError("NETWORK"));
    await first;
    expect(states.at(-1)).toEqual({ status: "authenticated", session });
    expect(states.some(state => state.status === "error")).toBe(false);
  });

  it("cancel/unmount impede publicação tardia e nova etapa me", async () => {
    const pending = deferred<typeof status>();
    statusMock.mockReturnValue(pending.promise);
    const { states, loader } = observe();
    const result = loader.refresh();
    const signal = statusMock.mock.calls[0]?.[0]?.signal;
    loader.cancel();
    pending.resolve(status);
    await result;
    expect(signal?.aborted).toBe(true);
    expect(states).toEqual([{ status: "loading" }]);
    expect(meMock).not.toHaveBeenCalled();
  });

  it("cancelamento deliberado não publica ABORT como erro", async () => {
    statusMock.mockImplementation(options => new Promise((_ok, reject) => {
      options?.signal?.addEventListener("abort", () => reject(new HttpError("ABORT")), { once: true });
    }));
    const { states, loader } = observe();
    const result = loader.refresh();
    loader.cancel();
    await result;
    expect(states).toEqual([{ status: "loading" }]);
  });

  it("novo refresh após cancelamento usa nova geração e aceita null sem default", async () => {
    const { states, loader } = observe();
    loader.cancel();
    const noScope = { ...session, companyId: null, unitId: null, permissions: [], contexts: [] };
    meMock.mockResolvedValue(noScope);
    await loader.refresh();
    expect(states.at(-1)).toEqual({ status: "authenticated", session: noScope });
  });
});
