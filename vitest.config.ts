import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

// Mismo alias "@/..." que tsconfig.json, para poder testear los Route Handlers.
//
// Las pruebas de e2e/ son de Playwright: necesitan la app levantada y un
// navegador, y se corren con `npm run test:e2e`. Sin la exclusión, vitest las
// tomaría por el nombre (*.spec.ts) y fallarían por no tener dónde correr.
export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
