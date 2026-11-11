import { describe, expect, it } from "vitest";
import { actualizarSeleccionServicios } from "@/lib/seleccionServicios";

describe("actualizarSelecciónServicios", () => {
  it("mantiene la selección de la página anterior y permite quitarla al volver", () => {
    const seleccionados = actualizarSeleccionServicios(new Set(), "servicio-pagina-1", true);
    const idsPaginaDos = ["servicio-pagina-2"];

    expect(seleccionados.has("servicio-pagina-1")).toBe(true);
    expect(idsPaginaDos.every((id) => !seleccionados.has(id))).toBe(true);

    const alVolver = actualizarSeleccionServicios(seleccionados, "servicio-pagina-1", false);
    expect(alVolver.has("servicio-pagina-1")).toBe(false);
  });
});
