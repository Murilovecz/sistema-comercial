import { type HttpError } from "../api/http";

export function contextMessage(error: HttpError, reconciled: boolean): string {
  if (!reconciled) return "Não foi possível confirmar qual empresa/unidade está ativa. Consulte a sessão antes de tentar outra troca.";
  switch (error.code) {
    case "FORBIDDEN_CONTEXT": return "Acesso a essa empresa/unidade recusado. A lista e o contexto foram consultados novamente.";
    case "INVALID_CSRF": return "A sessão mudou ou a verificação de acesso falhou. Confira o contexto atual antes de tentar novamente.";
    case "CONTEXT_CHANGED": return "A empresa/unidade mudou em outra janela. Confira o contexto consultado novamente.";
    case "SCOPE_REQUIRED": return "Selecione uma empresa/unidade disponível na lista atualizada.";
  }
  return "A resposta da troca não foi confirmada. O contexto exibido foi consultado novamente no servidor; confira antes de tentar outra troca.";
}
