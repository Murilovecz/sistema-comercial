import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const frontendRoot = fileURLToPath(new URL(".", import.meta.url));
const brandingCore = fileURLToPath(new URL("../shared/branding-core.mjs", import.meta.url));

export default defineConfig({
  root: frontendRoot,
  appType: "custom",
  base: "/ui/",
  publicDir: false,
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    origin: "http://127.0.0.1:5173",
    allowedHosts: ["127.0.0.1"],
    cors: {
      origin: "http://127.0.0.1:3210",
    },
    ws: {
      host: "127.0.0.1",
      clientPort: 5173,
    },
    fs: {
      strict: true,
      allow: [frontendRoot, brandingCore],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
