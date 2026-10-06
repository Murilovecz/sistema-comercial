import { expect, it } from "vitest";
import { HttpError } from "../api/http";
import { authenticationMessage } from "./auth-feedback";

it.each(["INVALID_CREDENTIALS", "INVALID_CSRF", "INVALID_SESSION", "AUTH_RATE_LIMIT", "AUTH_BUSY", "INTERNAL_ERROR"])("%s tem mensagem controlada sem enumerar usuário", code => {
  const text = authenticationMessage("login", new HttpError("HTTP", 401, code));
  expect(text).not.toMatch(/usuário existe|usuário inexistente|stack|INTERNAL_ERROR|INVALID_/i);
  expect(text.length).toBeGreaterThan(10);
});
it.each(["NETWORK", "TIMEOUT"] as const)("%s no logout não promete revogação", kind => {
  expect(authenticationMessage("logout", new HttpError(kind))).toContain("Não foi possível confirmar a saída");
});
