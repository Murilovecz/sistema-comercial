import { describe, expect, it } from "vitest";
import { HttpError } from "../api/http";
import { contextMessage } from "./context-feedback";
describe("feedback de contexto", () => {
  it.each(["FORBIDDEN_CONTEXT", "INVALID_CSRF", "CONTEXT_CHANGED", "SCOPE_REQUIRED"])("%s tem feedback seguro após releitura", code => {
    const message = contextMessage(new HttpError("HTTP", 403, code), true);
    expect(message).not.toContain(code); expect(message.length).toBeGreaterThan(20);
  });
  it.each(["NETWORK", "TIMEOUT"] as const)("%s não afirma que o POST falhou ou que o alvo foi aplicado", kind => {
    expect(contextMessage(new HttpError(kind), true)).toContain("contexto exibido foi consultado novamente");
    expect(contextMessage(new HttpError(kind), false)).toContain("Não foi possível confirmar qual");
  });
});
