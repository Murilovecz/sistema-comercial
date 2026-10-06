import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { SessionProvider } from "./session/SessionProvider";
import { BrandingProvider } from "./branding/BrandingProvider";
import "./app/app.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("A entrada da aplicação não contém o elemento raiz.");
}

createRoot(rootElement).render(
  <StrictMode>
    <SessionProvider><BrandingProvider><App /></BrandingProvider></SessionProvider>
  </StrictMode>,
);
