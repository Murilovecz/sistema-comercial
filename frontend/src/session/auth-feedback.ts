import { type HttpError } from "../api/http";

export function authenticationMessage(action: "login" | "logout", error: HttpError): string {
  if (action === "logout") {
    if (error.code === "INVALID_CSRF") return "Atualize a sessão antes de tentar sair novamente.";
    return "Não foi possível confirmar a saída. Os dados da sessão foram ocultados. Tente sair novamente.";
  }
  switch (error.code) {
    case "INVALID_CREDENTIALS": return "Login ou senha inválidos.";
    case "AUTH_RATE_LIMIT": return "Muitas tentativas. Aguarde antes de tentar novamente.";
    case "AUTH_BUSY": return "O acesso está ocupado. Aguarde um momento e tente novamente.";
    case "INVALID_CSRF":
    case "INVALID_SESSION": return "Atualize a sessão antes de tentar entrar novamente.";
  }
  if (error.kind === "NETWORK") return "Não foi possível conectar ao servidor. Tente novamente.";
  if (error.kind === "TIMEOUT") return "O servidor não respondeu no prazo. Atualize a sessão antes de tentar novamente.";
  return "Não foi possível entrar. Atualize a sessão e tente novamente.";
}
