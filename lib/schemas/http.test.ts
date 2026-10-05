import { describe, expect, it } from "vitest";
import { idSchema, paginacionSchema } from "./http";
describe("entrada HTTP", () => {
 it("acepta ids de producción y demo, rechaza rutas", () => {
  expect(idSchema.safeParse("servicio-demo").success).toBe(true);
  expect(idSchema.safeParse("../otro").success).toBe(false);
 });
 it("valida límites y valores por defecto", () => {
  expect(paginacionSchema.parse({})).toEqual({ pagina: 1, limite: 20 });
  for (const limite of [0, 101, "texto"]) expect(paginacionSchema.safeParse({ limite }).success).toBe(false);
 });
});
