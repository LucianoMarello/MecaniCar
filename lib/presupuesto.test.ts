import { describe, it, expect } from "vitest";
import {
  validarAprobacionPresupuesto,
  validarRechazoPresupuesto,
  validarCreacionPresupuesto,
} from "./presupuestos";

describe("Regla: Rechazo de Presupuesto", () => {
  it("pasa sin errores si el estado es PENDIENTE", () => {
    const errores = validarRechazoPresupuesto({ estado: "PENDIENTE" });
    expect(errores).toHaveLength(0);
  });

  it("falla si el estado es APROBADO", () => {
    const errores = validarRechazoPresupuesto({ estado: "APROBADO" });
    expect(errores).toContain("Solo puede rechazarse un presupuesto pendiente");
  });

  it("falla si el estado ya es RECHAZADO", () => {
    const errores = validarRechazoPresupuesto({ estado: "RECHAZADO" });
    expect(errores).toContain("Solo puede rechazarse un presupuesto pendiente");
  });
});

describe("Regla: Aprobación de Presupuesto", () => {
  it("pasa sin errores si el estado es PENDIENTE", () => {
    const errores = validarAprobacionPresupuesto({ estado: "PENDIENTE" });
    expect(errores).toHaveLength(0);
  });

  it("falla si el estado ya está APROBADO", () => {
    const errores = validarAprobacionPresupuesto({ estado: "APROBADO" });
    expect(errores).toContain(
      "Solamente puede aprobarse un presupuesto pendiente",
    );
  });

  it("falla si el estado ya está RECHAZADO", () => {
    const errores = validarAprobacionPresupuesto({ estado: "RECHAZADO" });
    expect(errores).toContain(
      "Solamente puede aprobarse un presupuesto pendiente",
    );
  });
});

describe("Regla: Creación de Presupuesto", () => {
  it("pasa sin errores si la orden está ABIERTA", () => {
    const errores = validarCreacionPresupuesto({ estado: "ABIERTA" });
    expect(errores).toHaveLength(0);
  });

  it("falla si la orden está FINALIZADA", () => {
    const errores = validarCreacionPresupuesto({ estado: "FINALIZADA" });
    expect(errores).toContain("No se puede presupuestar una orden finalizada");
  });

  it("acepta el borde de una orden que ya está EN_REPARACION", () => {
    const errores = validarCreacionPresupuesto({ estado: "EN_REPARACION" });
    expect(errores).toHaveLength(0);
  });
});
