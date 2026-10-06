import { type ReactNode } from "react";

interface FormFieldProps { htmlFor: string; label: string; children: ReactNode }

// O controle permanece HTML nativo; ID, ref e atributos ARIA pertencem ao consumidor.
export function FormField({ htmlFor, label, children }: FormFieldProps) {
  return <div className="ui-field"><label htmlFor={htmlFor}>{label}</label>{children}</div>;
}
