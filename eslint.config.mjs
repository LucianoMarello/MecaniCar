import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Prohibido `any`: si no sabés el tipo, usá `unknown` y validá con Zod.
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  // La config de Next ya ignora `.next/`. Estas son las carpetas que generan
  // las pruebas e2e (playwright.config.ts).
  globalIgnores([".next-e2e/**", "playwright-report/**", "test-results/**"]),
]);

export default eslintConfig;
