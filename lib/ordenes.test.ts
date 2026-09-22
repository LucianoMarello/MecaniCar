import { describe, it, expect } from "vitest";
import { validarFinalizacionOrden } from "./ordenes";

describe("Regla: Finalización de Orden", () => {
  it("pasa sin errores si está en reparación y tiene presupuesto aprobado", () => {
    const errores = validarFinalizacionOrden({
      estado: "EN_REPARACION",
      presupuestos: [{ estado: "APROBADO" }],
    });
    expect(errores).toHaveLength(0);
  });

  it("falla si la orden está abierta", () => {
    const errores = validarFinalizacionOrden({
      estado: "ABIERTA",
      presupuestos: [{ estado: "APROBADO" }],
    });
    expect(errores).toContain(
      "La orden debe estar EN_REPARACION para poder finalizarse",
    );
  });

  it("falla si no tiene presupuestos aprobados", () => {
    const errores = validarFinalizacionOrden({
      estado: "EN_REPARACION",
      presupuestos: [{ estado: "PENDIENTE" }],
    });
    expect(errores).toContain("La orden no tiene ningún presupuesto aprobado");
  });

  it("falla en el borde de una lista de presupuestos vacía", () => {
    const errores = validarFinalizacionOrden({
      estado: "EN_REPARACION",
      presupuestos: [],
    });
    expect(errores).toContain("La orden no tiene ningún presupuesto aprobado");
  });
});
