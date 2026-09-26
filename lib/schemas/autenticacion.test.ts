import { describe, expect, it } from "vitest";
import { cambiarRolSchema } from "./autenticacion";
describe("asignación de roles", () => {
  it.each(["CLIENTE", "MECANICO"])("acepta %s", (rol) => expect(cambiarRolSchema.safeParse({ rol }).success).toBe(true));
  it("rechaza ADMIN", () => expect(cambiarRolSchema.safeParse({ rol: "ADMIN" }).success).toBe(false));
});
