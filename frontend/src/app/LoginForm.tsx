import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { useSession } from "../session/SessionProvider";
import { authenticationMessage } from "../session/auth-feedback";
import { Button } from "../ui/Button";
import { FormField } from "../ui/FormField";
import { Alert } from "../ui/Alert";

export function LoginForm() {
  const { state, mutation, login } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const submitting = useRef(false);
  const passwordInput = useRef<HTMLInputElement>(null);
  const pending = mutation.status === "pending";
  const error = mutation.status === "error" && mutation.action === "login" ? mutation.error : undefined;

  // Devolver o foco somente após React habilitar novamente o campo.
  useEffect(() => { if (error && !pending) passwordInput.current?.focus(); }, [error, pending]);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current || pending || state.status !== "anonymous" || !state.csrfToken) return;
    submitting.current = true;
    try { await login({ login: username, password }); }
    finally {
      setPassword("");
      submitting.current = false;
    }
  };
  return <form className="ui-form" onSubmit={event => void submit(event)} aria-busy={pending}>
    <FormField htmlFor="login" label="Login">
      <input className="ui-control" id="login" name="login" autoComplete="username" required maxLength={120}
        aria-describedby={error ? "login-feedback" : undefined} aria-invalid={error?.code === "INVALID_CREDENTIALS" || undefined}
        value={username} onChange={event => setUsername(event.target.value)} disabled={pending} />
    </FormField>
    <FormField htmlFor="password" label="Senha">
      <input className="ui-control" ref={passwordInput} id="password" name="password" type="password" autoComplete="current-password" required maxLength={128}
        aria-describedby={error ? "login-feedback" : undefined} aria-invalid={error?.code === "INVALID_CREDENTIALS" || undefined}
        value={password} onChange={event => setPassword(event.target.value)} disabled={pending} />
    </FormField>
    {error && <Alert variant="error" id="login-feedback">{authenticationMessage("login", error)}</Alert>}
    <Button type="submit" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</Button>
  </form>;
}
