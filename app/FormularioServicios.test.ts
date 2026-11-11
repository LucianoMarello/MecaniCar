import { describe, expect, it } from "vitest";
import { actualizarSeleccionServicios } from "@/lib/seleccionServicios";

describe("selección de servicios entre páginas", () => {
  it("conserva servicios elegidos al reemplazar la página visible del catálogo", () => {
    const seleccionados = actualizarSeleccionServicios(new Set(), "servicio-pagina-1", true);
    const paginaDos = [{ id: "servicio-pagina-2" }];

    expect(paginaDos.map(({ id }) => seleccionados.has(id))).toEqual([false]);
    expect(seleccionados.has("servicio-pagina-1")).toBe(true);

    const alVolver = actualizarSeleccionServicios(seleccionados, "servicio-pagina-1", false);
    expect(alVolver.has("servicio-pagina-1")).toBe(false);
  });
});
