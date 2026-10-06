import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "./Button";
import { FormField } from "./FormField";
import { Alert } from "./Alert";
import { PageShell } from "./PageShell";

describe("primitivos sem dependência de DOM", () => {
  it("botão padrão não submete formulário acidentalmente", () => {
    expect(renderToStaticMarkup(<Button>Atualizar</Button>)).toContain('type="button"');
  });
  it("botão preserva submit, disabled e nome acessível", () => {
    const html = renderToStaticMarkup(<Button type="submit" disabled aria-label="Entrar no sistema">Entrar</Button>);
    expect(html).toContain('type="submit"'); expect(html).toContain('disabled=""');
    expect(html).toContain('aria-label="Entrar no sistema"'); expect(html).toContain(">Entrar</button>");
  });
  it("campo associa label e mantém semântica nativa e erro vinculado", () => {
    const html = renderToStaticMarkup(<FormField htmlFor="senha" label="Senha">
      <input id="senha" type="password" autoComplete="current-password" aria-describedby="erro" />
    </FormField>);
    expect(html).toContain('<label for="senha">Senha</label>'); expect(html).toContain('id="senha"');
    expect(html).toContain('autoComplete="current-password"'); expect(html).toContain('aria-describedby="erro"');
  });
  it("erro é anunciado sem executar conteúdo da mensagem", () => {
    const html = renderToStaticMarkup(<Alert variant="error" id="erro">{'<script>privado</script>'}</Alert>);
    expect(html).toContain('role="alert"'); expect(html).toContain('id="erro"');
    expect(html).toContain("&lt;script&gt;"); expect(html).not.toContain("<script>");
  });
  it("informação usa status, sem anunciar como erro", () => {
    const html = renderToStaticMarkup(<Alert>Verificando sessão…</Alert>);
    expect(html).toContain('role="status"'); expect(html).not.toContain('role="alert"');
  });
  it("página tem landmark main e título, preservando conteúdo", () => {
    const html = renderToStaticMarkup(<PageShell title="Sistema Comercial"><p>Conteúdo</p></PageShell>);
    expect(html).toContain("<main"); expect(html).toContain("<h1>Sistema Comercial</h1>");
    expect(html).toContain("<p>Conteúdo</p>");
  });
});
