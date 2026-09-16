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
