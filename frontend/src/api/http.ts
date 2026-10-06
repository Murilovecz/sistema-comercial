export type HttpErrorKind = "HTTP" | "NETWORK" | "TIMEOUT" | "ABORT" | "INVALID_RESPONSE";

const messages: Record<HttpErrorKind, string> = {
  HTTP: "Não foi possível concluir a solicitação.",
  NETWORK: "Não foi possível conectar ao servidor.",
  TIMEOUT: "O servidor não respondeu no prazo. Confira a operação antes de tentar novamente.",
  ABORT: "Solicitação cancelada. Isso não confirma o cancelamento da operação no servidor.",
  INVALID_RESPONSE: "O servidor retornou uma resposta inválida.",
};

export class HttpError extends Error {
  readonly kind: HttpErrorKind;
  readonly status: number | undefined;
  readonly code: string | undefined;

  constructor(kind: HttpErrorKind, status?: number, code?: string) {
    // O envelope não vira mensagem de UI: pode conter detalhes internos ou dados privados.
    super(messages[kind]);
    this.name = "HttpError";
    this.kind = kind;
    this.status = status;
    this.code = code;
  }
}

export interface RequestOptions {
  query?: Readonly<Record<string, string | number | boolean>>;
  context?: Readonly<{ companyId: string; unitId: string }>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface PostOptions extends RequestOptions {
  csrfToken?: string;
}

function apiPath(path: string, query: RequestOptions["query"]): string {
  // Sem URLs, escapes, traversal, query embutida ou fragmentos; query é sempre um valor.
  if (!/^\/api\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\/?$/.test(path)) {
    throw new TypeError("Use um caminho interno controlado sob /api/.");
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) params.set(key, String(value));
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

function backendCode(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || !("code" in value)) return undefined;
  return typeof value.code === "string" && /^[A-Z][A-Z0-9_]{0,79}$/.test(value.code)
    ? value.code : undefined;
}

async function send(path: string, init: RequestInit, options: RequestOptions): Promise<unknown> {
  const { query, context, signal } = options;
  const url = apiPath(path, query);
  const timeoutMs = options.timeoutMs ?? 15_000;
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2_147_483_647) {
    throw new TypeError("Informe um timeout inteiro, positivo e representável em milissegundos.");
  }
  if (signal?.aborted) throw new HttpError("ABORT");

  const headers = new Headers(init.headers);
  if (context) {
    headers.set("X-Company-ID", context.companyId);
    headers.set("X-Unit-ID", context.unitId);
  }
  const controller = new AbortController();
  let cancelled: "TIMEOUT" | "ABORT" | undefined;
  let status: number | undefined;
  const cancel = (kind: "TIMEOUT" | "ABORT") => {
    if (!cancelled) {
      cancelled = kind;
      controller.abort();
    }
  };
  const callerAbort = () => cancel("ABORT");
  signal?.addEventListener("abort", callerAbort, { once: true });
  const timer = setTimeout(() => cancel("TIMEOUT"), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init, headers, signal: controller.signal,
      credentials: "same-origin", mode: "same-origin", redirect: "error", cache: "no-store",
    });
    status = response.status;
    const text = await response.text();
    if (cancelled) throw new HttpError(cancelled, status);
    if (response.ok && (status === 204 || status === 205) && text === "") return undefined;

    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      throw new HttpError(response.ok ? "INVALID_RESPONSE" : "HTTP", status);
    }
    if (!response.ok) throw new HttpError("HTTP", status, backendCode(value));
    // O endpoint futuro valida seu DTO; transporte entrega somente JSON bruto.
    return value;
  } catch (error: unknown) {
    if (cancelled) throw new HttpError(cancelled, status);
    if (error instanceof HttpError) throw error;
    throw new HttpError("NETWORK", status);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", callerAbort);
  }
}

export function get(path: string, options: RequestOptions = {}): Promise<unknown> {
  return send(path, { method: "GET" }, options);
}

export async function post(path: string, body: unknown, options: PostOptions = {}): Promise<unknown> {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (options.csrfToken !== undefined) headers.set("X-CSRF-Token", options.csrfToken);
  const serialized = JSON.stringify(body);
  if (serialized === undefined) throw new TypeError("Informe um corpo JSON serializável.");
  return send(path, { method: "POST", headers, body: serialized }, options);
}
