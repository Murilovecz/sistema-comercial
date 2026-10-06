import {useEffect, useState, type CSSProperties} from "react";
import {Link} from "react-router";
import {DEFAULT_BRANDING, brandTokens, contextKey, type Branding} from "../../../shared/branding-core.mjs";
import {useSession} from "../session/SessionProvider";
import {HttpError} from "../api/http";
import {useBranding} from "./BrandingProvider";
import {Button} from "../ui/Button";
import {Alert} from "../ui/Alert";
import {FormField} from "../ui/FormField";
import {PageShell} from "../ui/PageShell";

export function BrandingPreview({value, prefersDark = false}: {value: Branding; prefersDark?: boolean}) {
  return <section className="branding-preview" style={brandTokens(value, prefersDark) as CSSProperties} aria-label="Prévia local da aparência">
    <div className="ui-panel"><h2>{value.displayName || "Nome exibido"}</h2><p>Texto e componentes da aplicação.</p>
      <span className="branding-badge">Destaque</span>
      <div className="ui-actions"><Button>Botão primário</Button><Button variant="secondary">Botão secundário</Button></div>
    </div>
  </section>;
}
function Editor() {
  const {branding, loading, prefersDark, save, reload} = useBranding();
  const [draft, setDraft] = useState<Branding>(branding), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => {setDraft(branding);}, [branding]);
  const update = (patch: Partial<Branding>) => {setDraft({...draft, ...patch}); setMessage("");};
  const submit = async () => {
    if (busy || loading) return; setBusy(true); setMessage("");
    try {await save(draft); setError(false); setMessage("Aparência salva para esta organização.");}
    catch (e) {setError(true); setMessage(e instanceof HttpError && e.code === "FORBIDDEN_BRANDING_SCOPE" ? "Para salvar a aparência, você precisa gerenciar todas as unidades ativas desta organização." : e instanceof HttpError && e.code === "STALE_BRANDING" ? "Outra pessoa alterou a aparência. Recarregue e revise antes de salvar." : "Não foi possível confirmar a gravação. Recarregue para conferir antes de tentar novamente.");}
    finally {setBusy(false);}
  };
  return <PageShell title="Aparência" description="Personalização visual da organização atual">
    <p><Link to="/">Voltar à sessão</Link></p>
    <form className="ui-form" onSubmit={e => {e.preventDefault(); void submit();}} aria-busy={busy || loading}>
      <fieldset disabled={busy || loading} className="branding-fields"><legend>Identidade visual</legend>
        <FormField htmlFor="brand-name" label="Nome exibido"><input className="ui-control" id="brand-name" required maxLength={80} value={draft.displayName} onChange={e => update({displayName: e.target.value})} /></FormField>
        <FormField htmlFor="brand-primary" label="Cor principal"><input className="ui-control" type="color" id="brand-primary" value={draft.primaryColor} onChange={e => update({primaryColor: e.target.value.toUpperCase()})} /></FormField>
        <FormField htmlFor="brand-accent" label="Cor de destaque"><input className="ui-control" type="color" id="brand-accent" value={draft.accentColor} onChange={e => update({accentColor: e.target.value.toUpperCase()})} /></FormField>
        <FormField htmlFor="brand-theme" label="Modo visual"><select className="ui-control" id="brand-theme" value={draft.themeMode} onChange={e => {const mode = e.target.value; if (mode === "LIGHT" || mode === "DARK" || mode === "SYSTEM") update({themeMode: mode});}}><option value="LIGHT">Claro</option><option value="DARK">Escuro</option><option value="SYSTEM">Seguir o sistema</option></select></FormField>
        <div className="ui-actions"><Button type="submit">Salvar</Button><Button variant="secondary" onClick={() => {setDraft(branding); setMessage("");}}>Cancelar alterações</Button><Button variant="secondary" onClick={() => update({...DEFAULT_BRANDING, revision: draft.revision})}>Restaurar padrão</Button></div>
      </fieldset>
    </form>
    <p className="session-note">A prévia só é aplicada à organização ao salvar. Logos serão disponibilizadas em uma etapa futura.</p>
    {message && <Alert variant={error ? "error" : "info"}>{message}</Alert>}
    <div className="ui-actions"><Button variant="secondary" disabled={busy || loading} onClick={() => {setMessage(""); void reload();}}>Recarregar aparência</Button></div>
    <BrandingPreview value={draft} prefersDark={prefersDark} />
  </PageShell>;
}
export function AppearancePage() {
  const {state, contextReady} = useSession();
  if (state.status !== "authenticated" || !contextReady) return <PageShell title="Aparência"><Alert>Confirme sua sessão e organização para continuar.</Alert><Link to="/">Voltar</Link></PageShell>;
  if (!state.session.permissions.includes("companies.manage")) return <PageShell title="Aparência"><Alert variant="error">Seu perfil não permite alterar a aparência.</Alert><Link to="/">Voltar</Link></PageShell>;
  return <Editor key={contextKey({sessionId: state.session.sessionId, companyId: state.session.companyId!, unitId: state.session.unitId!})} />;
}
