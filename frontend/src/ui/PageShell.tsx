import { type ReactNode } from "react";

interface PageShellProps { title: string; description?: string; children: ReactNode }

export function PageShell({ title, description, children }: PageShellProps) {
  return <main className="ui-page">
    <header className="ui-page-header"><h1>{title}</h1>{description && <p>{description}</p>}</header>
    <div className="ui-panel">{children}</div>
  </main>;
}
