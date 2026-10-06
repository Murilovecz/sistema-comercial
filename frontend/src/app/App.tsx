import { BrowserRouter, Link, Route, Routes } from "react-router";
import { type ReactNode } from "react";
import { useSession } from "../session/SessionProvider";
import { authenticationMessage } from "../session/auth-feedback";
import { LoginForm } from "./LoginForm";
import { ContextSelector } from "./ContextSelector";
import { contextMessage } from "../session/context-feedback";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import { PageShell } from "../ui/PageShell";
import { useBranding } from "../branding/BrandingProvider";
import { AppearancePage } from "../branding/AppearancePage";

function SessionView() {
  const {branding} = useBranding();
  const { state, mutation, refreshSession, logout } = useSession();
  let content: ReactNode;
  switch (state.status) {
    case "loading": content = mutation.status === "pending" && mutation.action === "context"
      ? <><Alert>Alterando e conferindo empresa/unidade…</Alert><div className="ui-actions"><Button variant="secondary" onClick={() => void logout()}>Sair</Button></div></>
      : <Alert>{mutation.status === "pending" && mutation.action === "logout" ? "Saindo…" : "Verificando sessão…"}</Alert>; break;
    case "anonymous": content = <><h2>Entrar</h2><p className="session-note">Não autenticado</p>{state.csrfToken && <LoginForm />}</>; break;
    case "setup-required": content = <><Alert>Configuração inicial necessária</Alert><div className="ui-actions"><a href="/">Abrir configuração no sistema atual</a></div></>; break;
    case "error": content = mutation.status === "error" && mutation.action === "logout"
      ? <><Alert variant="error">{authenticationMessage("logout", mutation.error)}</Alert>
        <div className="ui-actions"><Button onClick={() => void logout()}>Tentar sair novamente</Button></div></>
      : <Alert variant="error">Não foi possível verificar a sessão.</Alert>; break;
    case "authenticated": {
      const { user, companyId, unitId, contexts } = state.session;
      const context = contexts.find(item => item.companyId === companyId && item.unitId === unitId);
      content = <>
        <section className="session-summary" aria-live="polite"><h2>Sessão atual</h2>
        <p><strong>Usuário:</strong> {user.name}</p>
        {companyId !== null && unitId !== null
          ? <p><strong>Empresa:</strong> {context?.companyName ?? companyId} / <strong>Unidade:</strong> {context?.unitName ?? unitId}</p>
          : <p>Empresa/unidade ainda não selecionada.</p>}
        <div className="ui-actions"><Button variant="secondary" onClick={() => void logout()}>Sair</Button></div>
        </section>
        <h2>Contexto de trabalho</h2>
        <ContextSelector key={state.session.csrfToken} />
        {state.session.permissions.includes("companies.manage") && <p><Link to="/appearance">Aparência da organização</Link></p>}
      </>;
      break;
    }
  }
  return <PageShell title={branding.displayName} description="Acesso e contexto de trabalho">
    {content}
    {mutation.status === "error" && mutation.action === "context" && state.status !== "anonymous" &&
      <Alert className="session-feedback" id="context-feedback" variant="error">{contextMessage(mutation.error, state.status === "authenticated")}</Alert>}
    {state.status !== "loading" && mutation.status !== "pending" && <div className="ui-actions"><Button variant="secondary" onClick={() => void refreshSession()}>
      {state.status === "error" ? "Tentar novamente" : "Atualizar sessão"}
    </Button></div>}
  </PageShell>;
}

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/appearance" element={<AppearancePage />} />
        <Route
          path="/"
          element={<SessionView />}
        />
        <Route
          path="*"
          element={
            <PageShell title="Página não encontrada">
              <Link to="/">Voltar ao início</Link>
            </PageShell>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
