import { describe, it, expect } from "vitest";
import {
  validarConfirmacionTurno,
  validarCancelacionTurno,
  validarIngresoTaller,
} from "./turnos";

describe("Reglas: Turnos", () => {
  describe("Confirmación", () => {
    it("pasa sin errores si está PENDIENTE", () => {
      expect(validarConfirmacionTurno({ estado: "PENDIENTE" })).toHaveLength(0);
    });

    it("falla si ya está CONFIRMADO o CANCELADO", () => {
      expect(validarConfirmacionTurno({ estado: "CONFIRMADO" })).toContain(
        "Solo puede confirmarse un turno pendiente",
      );
      expect(validarConfirmacionTurno({ estado: "CANCELADO" })).toContain(
        "Solo puede confirmarse un turno pendiente",
      );
    });
  });

  describe("Cancelación", () => {
    it("pasa si no está cancelado y no tiene orden", () => {
      expect(
        validarCancelacionTurno({ estado: "PENDIENTE", ordenTrabajo: null }),
      ).toHaveLength(0);
      expect(
        validarCancelacionTurno({ estado: "CONFIRMADO", ordenTrabajo: null }),
      ).toHaveLength(0);
    });

    it("falla si ya está CANCELADO", () => {
      expect(
        validarCancelacionTurno({ estado: "CANCELADO", ordenTrabajo: null }),
      ).toContain("El turno ya se encuentra cancelado");
    });

    it("falla si ya tiene orden de trabajo", () => {
      expect(
        validarCancelacionTurno({
          estado: "CONFIRMADO",
          ordenTrabajo: { id: "orden-1" },
        }),
      ).toContain(
        "No se puede cancelar un turno que ya ingresó al taller (tiene orden de trabajo)",
      );
    });
  });
});

describe("Ingreso al Taller", () => {
  it("pasa si el turno está CONFIRMADO y no tiene orden", () => {
    expect(
      validarIngresoTaller({ estado: "CONFIRMADO", ordenTrabajo: null }),
    ).toHaveLength(0);
  });

  it("falla si no está confirmado o ya tiene orden", () => {
    expect(
      validarIngresoTaller({ estado: "PENDIENTE", ordenTrabajo: null }),
    ).toContain("El turno debe estar CONFIRMADO para registrar el ingreso");
    expect(
      validarIngresoTaller({
        estado: "CONFIRMADO",
        ordenTrabajo: { id: "orden-1" },
      }),
    ).toContain("Este turno ya tiene una orden de trabajo asociada");
  });
});
