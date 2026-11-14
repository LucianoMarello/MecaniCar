/**
 * Prueba la base de las demás: que las sesiones que fabrica `preparar.ts`
 * sean aceptadas por la app y que el rol salga de la base.
 *
 * Si esto falla, ninguna otra prueba e2e significa nada: la del flujo y las de
 * permisos dan por hecho que el cliente entra como cliente y el mecánico como
 * mecánico.
 */
import { expect, test } from "@playwright/test";
import { SESION } from "./sesiones";

const PERSONAS = [
  { quien: "el cliente", sesion: SESION.cliente, email: "cliente@ejemplo.com", rol: "CLIENTE" },
  { quien: "otro cliente", sesion: SESION.otroCliente, email: "otro-cliente@ejemplo.com", rol: "CLIENTE" },
  { quien: "el mecánico", sesion: SESION.mecanico, email: "mecanico@ejemplo.com", rol: "MECANICO" },
  { quien: "el administrador", sesion: SESION.admin, email: "admin@ejemplo.com", rol: "ADMIN" },
] as const;

for (const persona of PERSONAS) {
  test.describe(persona.quien, () => {
    test.use({ storageState: persona.sesion });

    test(`entra con el rol ${persona.rol}`, async ({ request }) => {
      const respuesta = await request.get("/api/auth/session");

      expect(respuesta.ok()).toBe(true);
      expect((await respuesta.json()).user).toMatchObject({
        email: persona.email,
        rol: persona.rol,
      });
    });
  });
}

test("sin sesión, una pantalla privada manda a ingresar", async ({ page }) => {
  await page.goto("/vehiculos");

  await expect(page).toHaveURL(/\/ingresar/);
  await expect(page.getByRole("heading", { name: "Ingresar a MecaniCar" })).toBeVisible();
});
