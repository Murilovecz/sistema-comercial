import { useState, type SubmitEvent } from "react";
import { useSession } from "../session/SessionProvider";
import { Button } from "../ui/Button";
import { FormField } from "../ui/FormField";
import { Alert } from "../ui/Alert";

export function ContextSelector() {
  const { state, mutation, changeContext } = useSession();
  // Valor local é somente índice; IDs são resolvidos na lista verificada.
  const [choice, setChoice] = useState("");
  if (state.status !== "authenticated") return null;
  const { contexts, companyId, unitId } = state.session;
  if (contexts.length === 0) return <Alert>Nenhuma empresa/unidade disponível. Consulte o administrador.</Alert>;
  const current = contexts.findIndex(c => c.companyId === companyId && c.unitId === unitId);
  const value = choice || (current >= 0 ? String(current) : "");
  const selected = contexts.find((_context, index) => String(index) === value);
  const pending = mutation.status === "pending";
  const same = selected?.companyId === companyId && selected?.unitId === unitId;
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pending && selected && !same) void changeContext(selected);
  };
  return <form className="ui-form" onSubmit={submit} aria-busy={pending}>
    <FormField htmlFor="session-context" label="Empresa e unidade">
      <select className="ui-control" id="session-context" value={value} required disabled={pending}
        aria-describedby={mutation.status === "error" && mutation.action === "context" ? "context-feedback" : undefined}
        onChange={event => setChoice(event.target.value)}>
        <option value="" disabled>Selecione uma empresa/unidade</option>
        {contexts.map((context, index) => <option key={JSON.stringify([context.companyId, context.unitId])} value={String(index)}>
          {context.companyName} — {context.unitName}
        </option>)}
      </select>
    </FormField>
    <Button type="submit" disabled={pending || !selected || same}>
      {companyId === null ? "Selecionar contexto" : "Trocar contexto"}
    </Button>
  </form>;
}
