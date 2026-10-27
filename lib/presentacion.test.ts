import { describe, expect, it } from "vitest";
import { formatearFecha } from "./presentacion";

describe("fechas de presentación", () => {
  it("muestra el día de Buenos Aires incluso cuando UTC ya pasó al siguiente", () => {
    expect(formatearFecha(new Date("2026-10-01T02:00:00Z"))).toContain(
      "30 de septiembre de 2026",
    );
  });
});
