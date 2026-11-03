import { describe, expect, it } from "vitest";
import { destinoIngreso } from "./destinoIngreso";

describe("destino después de Google", () => {
  it("conserva el detalle solicitado", () => {
    expect(destinoIngreso("/vehiculos/vehiculo-a")).toBe(
      "/vehiculos/vehiculo-a",
    );
  });
  it("rechaza destinos externos o ambiguos", () => {
    for (const valor of [
      undefined,
      ["/vehiculos"],
      "https://otro.com",
      "//otro.com",
      "/vehiculos/../otro",
      "/vehiculos/%2f%2fotro.com",
      "/api/usuarios",
    ]) {
      expect(destinoIngreso(valor)).toBe("/vehiculos");
    }
  });
});
