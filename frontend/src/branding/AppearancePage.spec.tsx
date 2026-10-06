import {describe, expect, it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {BrandingPreview} from "./AppearancePage";
import {DEFAULT_BRANDING} from "../../../shared/branding-core.mjs";

describe("prévia de aparência", () => {
  it("usa tokens locais, componentes do DS e texto escapado", () => {
    const html = renderToStaticMarkup(<BrandingPreview value={{...DEFAULT_BRANDING, displayName: "<img src=x onerror=alert(1)>", primaryColor: "#FFFFFF", accentColor: "#000000", themeMode: "DARK"}} />);
    expect(html).toContain("--brand-primary:#FFFFFF");
    expect(html).toContain("--brand-on-primary:#000000");
    expect(html).toContain("--brand-on-accent:#FFFFFF");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("<img");
    expect(html).toContain("Botão primário");
    expect(html).toContain("Botão secundário");
    expect(html).toContain("ui-panel");
    expect(html).toContain("Destaque");
    expect(html).toContain("color-scheme:dark");
  });
  it("prévia SYSTEM acompanha a preferência sem mudar o default central", () => {
    const html = renderToStaticMarkup(<BrandingPreview value={{...DEFAULT_BRANDING, themeMode: "SYSTEM"}} prefersDark />);
    expect(html).toContain("color-scheme:dark");
    expect(DEFAULT_BRANDING.themeMode).toBe("LIGHT");
  });
});
