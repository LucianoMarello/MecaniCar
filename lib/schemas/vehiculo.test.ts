import { describe, it, expect } from "vitest";
import { vehiculoSchema } from "./vehiculo";

describe("Validación de Vehículos (Zod)", () => {
  it("debe aceptar un vehículo con datos válidos", () => {
    const vehiculoValido = {
      patente: "AB123CD",
      marca: "Ford",
      modelo: "Focus",
      anio: new Date().getFullYear(),
    };

    const result = vehiculoSchema.safeParse(vehiculoValido);
    expect(result.success).toBe(true);
  });

  it("guarda la patente en mayúsculas, sin espacios ni guiones", () => {
    for (const escrita of [" ab 123 cd ", "AB-123-CD", "ab - 123cd"]) {
      const result = vehiculoSchema.safeParse({
        patente: escrita,
        marca: "Ford",
        modelo: "Focus",
      });

      expect(result.success && result.data.patente).toBe("AB123CD");
    }
  });

  it("rechaza símbolos en la patente", () => {
    for (const patente of ["AB#123", "AB/123CD", "ÁB123CD", "AB.123.CD", "abßcd1", "ﬀ1234"]) {
      const result = vehiculoSchema.safeParse({ patente, marca: "Ford", modelo: "Focus" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.patente).toContain(
          "La patente solo puede tener letras y números",
        );
      }
    }
  });

  it("sigue aceptando las patentes que ya están en la base", () => {
    for (const patente of ["PRB123", "C5A123", "API123", "PR10T1", "AB123CD", "TEST01"]) {
      const result = vehiculoSchema.safeParse({ patente, marca: "Ford", modelo: "Focus" });

      expect(result.success).toBe(true);
    }
  });

  it("cuenta el largo de la patente sin los espacios", () => {
    const result = vehiculoSchema.safeParse({
      patente: "AB 12",
      marca: "Ford",
      modelo: "Focus",
    });

    expect(result.success).toBe(false);
  });

  it("explica en castellano un año que no es un número", () => {
    const result = vehiculoSchema.safeParse({
      patente: "AB123CD",
      marca: "Ford",
      modelo: "Focus",
      anio: Number("dos mil"),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.anio).toEqual([
        "El año debe ser un número",
      ]);
    }
  });

  it("debe rechazar un vehículo con un año superior al límite dinámico", () => {
    const vehiculoInvalido = {
      patente: "AB123CD",
      marca: "Ford",
      modelo: "Focus",
      anio: new Date().getFullYear() + 2, // Año futuro inválido
    };

    const result = vehiculoSchema.safeParse(vehiculoInvalido);

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorAnio = result.error.issues.find((issue) =>
        issue.path.includes("anio"),
      );
      expect(errorAnio?.message).toBe("El año del vehículo no es válido");
    }
  });
});
