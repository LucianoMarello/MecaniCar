import { describe, expect, it } from "vitest";
import { fechaHoraArgentina } from "@/lib/formularios";
import { turnoSchema } from "./turno";

const motivo = "Ruido en el tren delantero";

describe("validación de turnos (Zod)", () => {
  it("explica en castellano la falta de vehículo y de fecha", () => {
    const result = turnoSchema.safeParse({ vehiculoId: "", fechaHora: "", motivo });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errores = result.error.flatten().fieldErrors;
      expect(errores.vehiculoId).toEqual(["Elegí un vehículo"]);
      expect(errores.fechaHora).toEqual(["Ingresá una fecha y hora válidas"]);
    }
  });

  it("rechaza un turno en el pasado (RN06)", () => {
    const result = turnoSchema.safeParse({
      vehiculoId: "vehiculo-1",
      fechaHora: "2020-01-01T10:00:00-03:00",
      motivo,
    });
    expect(result.success).toBe(false);
  });
});

describe("hora del formulario", () => {
  it("interpreta la hora del formulario como hora de Buenos Aires", () => {
    const fecha = new Date(fechaHoraArgentina("2026-11-10T09:30"));
    expect(fecha.toISOString()).toBe("2026-11-10T12:30:00.000Z");
  });

  it("deja pasar sin cambios un valor que no es de datetime-local", () => {
    expect(fechaHoraArgentina("")).toBe("");
  });
});
