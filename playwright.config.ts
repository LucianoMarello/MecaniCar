/**
 * Las pruebas de punta a punta: el sistema entero, desde un navegador.
 *
 * Compila la app y la levanta con `next start` (lo mismo que corre en Vercel)
 * contra una base local, y la usa como una persona: entra a una pantalla,
 * completa un formulario, aprieta un botón y mira qué aparece.
 *
 *   npm test           las reglas y los Route Handlers, sin levantar nada (vitest)
 *   npm run test:e2e   el sistema entero, con base y navegador (esto)
 */
import path from "node:path";
import { config as cargarEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

// Las variables que ya están definidas ganan: dotenv no las pisa. Así el CI
// puede cambiar alguna sin tocar el archivo.
cargarEnv({ path: path.join(__dirname, ".env.e2e"), quiet: true });

/**
 * El cinturón de seguridad. Estas pruebas registran vehículos, piden turnos y
 * crean órdenes: contra producción dejarían basura en pantallas reales.
 *
 * Se revisan las DOS direcciones porque `prisma.config.ts` completa con
 * `.env.local` (que apunta a Supabase) toda variable que falte. Si
 * `.env.e2e` no definiera DIRECT_URL, las migraciones de las pruebas irían a
 * la base de producción aunque DATABASE_URL fuera local.
 */
for (const nombre of ["DATABASE_URL", "DIRECT_URL"]) {
  const host = new URL(process.env[nombre] ?? "postgresql://sin-definir").hostname;
  if (!["localhost", "127.0.0.1"].includes(host)) {
    throw new Error(
      `Las pruebas e2e solo corren contra una base local, y ${nombre} apunta a ${host}.`,
    );
  }
}

// `next start` también completa con `.env.local` lo que falte. Definida y
// vacía, Next no carga la clave real y la app no manda correos (spec 9.3).
if (process.env.RESEND_API_KEY !== "") {
  throw new Error("Las pruebas e2e no mandan correos: RESEND_API_KEY tiene que estar vacía.");
}

const PUERTO = 3100;

export default defineConfig({
  testDir: "e2e",

  // Una sola base para todas las pruebas: en fila, no en paralelo.
  workers: 1,
  fullyParallel: false,

  // En CI se reintenta una vez. Si pasa al segundo intento, el reporte la
  // marca como "flaky": no es verde, es una prueba que hay que mirar.
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",

  globalSetup: "./e2e/preparar.ts",

  use: {
    baseURL: `http://localhost:${PUERTO}`,
    // Si una prueba falla, queda grabado el recorrido: pantallas, red y
    // consola, paso a paso. Se abre con `npx playwright show-trace`.
    trace: "retain-on-failure",
  },

  projects: [{ name: "escritorio", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    // `next build` y no `npm run build`: el cliente de Prisma ya se generó en
    // el `npm install`, y en Windows regenerarlo falla si hay un
    // `npm run dev` abierto.
    command: `npx next build && npx next start --port ${PUERTO}`,
    url: `http://localhost:${PUERTO}/ingresar`,
    reuseExistingServer: false,
    timeout: 300_000,
    // En otra carpeta que la de `npm run dev`: compilar encima de un
    // servidor de desarrollo que está corriendo lo rompe.
    env: { NEXT_DIST_DIR: ".next-e2e" },
  },
});
