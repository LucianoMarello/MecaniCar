import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Mismo alias "@/..." que tsconfig.json, para poder testear los Route Handlers.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
});
