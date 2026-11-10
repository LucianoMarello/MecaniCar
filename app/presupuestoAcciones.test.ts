import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  obtenerUsuario: vi.fn(), crear: vi.fn(), editar: vi.fn(), decidir: vi.fn(),
  revalidate: vi.fn(),
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`); }),
}));
vi.mock("@/lib/auth", () => ({ obtenerUsuario: mocks.obtenerUsuario }));
vi.mock("@/lib/casos/presupuestos", () => ({
  crearPresupuesto: mocks.crear, actualizarPresupuesto: mocks.editar, decidirPresupuesto: mocks.decidir,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/errores", () => ({ esConflicto: (error: unknown) => error instanceof Error && error.message === "conflict" }));

import { crearPresupuestoAction, editarPresupuestoAction, decidirPresupuestoAction } from "./(app)/presupuestos/acciones";
import { SIN_ENVIAR } from "@/lib/formularios";

const cliente = { id: "cliente-1", email: "c@example.com", nombre: "C", rol: "CLIENTE" };
const mecanico = { id: "mecanico-1", email: "m@example.com", nombre: "M", rol: "MECANICO" };
function form(ids: string[]) { const data = new FormData(); for (const id of ids) data.append("serviciosIds", id); return data; }
const creado = { resultado: "CREADO" as const, presupuesto: { id: "presupuesto-1" }, avisoEnviado: true };

describe("acciones de presupuestos", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.obtenerUsuario.mockResolvedValue(mecanico); });
  it("creación exige personal y no escribe para cliente", async () => {
    mocks.obtenerUsuario.mockResolvedValue(cliente);
    await expect(crearPresupuestoAction("orden-1", SIN_ENVIAR, form(["servicio-1"]))).resolves.toMatchObject({ mensaje: expect.any(String) });
    expect(mocks.crear).not.toHaveBeenCalled();
  });
  it("creación valida orden y mínimo de un servicio", async () => {
    const r = await crearPresupuestoAction("!", SIN_ENVIAR, form([]));
    expect(r.errores?.serviciosIds).toBeDefined();
    expect(mocks.crear).not.toHaveBeenCalled();
  });
  it("creación traduce regla de negocio y conflicto", async () => {
    mocks.crear.mockResolvedValue({ resultado: "RECHAZADO", motivos: ["Orden finalizada"] });
    expect((await crearPresupuestoAction("orden-1", SIN_ENVIAR, form(["servicio-1"]))).mensaje).toContain("Orden finalizada");
    mocks.crear.mockRejectedValueOnce(new Error("conflict"));
    const r = await crearPresupuestoAction("orden-1", SIN_ENVIAR, form(["servicio-1"]));
    expect(r.mensaje).toContain("presupuesto o cambió");
  });
  it("creación exitosa revalida y redirige a detalle; falla de aviso queda en URL", async () => {
    mocks.crear.mockResolvedValue({ ...creado, avisoEnviado: false });
    await expect(crearPresupuestoAction("orden-1", SIN_ENVIAR, form(["servicio-1"]))).rejects.toThrow("REDIRECT:/presupuestos/presupuesto-1?aviso=pendiente");
    expect(mocks.revalidate).toHaveBeenCalledWith("/presupuestos");
    expect(mocks.revalidate).toHaveBeenCalledWith("/ordenes-trabajo");
  });
  it("edición exige taller, valida selección y actualiza las rutas", async () => {
    mocks.obtenerUsuario.mockResolvedValue(cliente);
    expect((await editarPresupuestoAction("id-1", SIN_ENVIAR, form(["s-1"]))).mensaje).toContain("Solo el taller");
    mocks.obtenerUsuario.mockResolvedValue(mecanico);
    expect((await editarPresupuestoAction("id-1", SIN_ENVIAR, form([]))).errores?.serviciosIds).toBeDefined();
    mocks.editar.mockResolvedValue({ resultado: "ACTUALIZADO", avisoEnviado: true });
    await editarPresupuestoAction("id-1", SIN_ENVIAR, form(["s-1"]));
    expect(mocks.editar).toHaveBeenCalledWith("id-1", ["s-1"]);
    expect(mocks.revalidate).toHaveBeenCalledWith("/presupuestos/id-1");
  });
  it("edición traduce conflictos de negocio", async () => {
    mocks.editar.mockRejectedValue(new Error("conflict"));
    expect((await editarPresupuestoAction("id-1", SIN_ENVIAR, form(["s-1"]))).mensaje).toContain("finalizada");
  });
  it.each(["APROBAR", "RECHAZAR"] as const)("decisión %s exige cliente y propaga rechazo de regla", async (decision) => {
    mocks.obtenerUsuario.mockResolvedValue(mecanico);
    expect((await decidirPresupuestoAction("p-1", decision)).mensaje).toContain("cliente propietario");
    mocks.obtenerUsuario.mockResolvedValue(cliente);
    mocks.decidir.mockResolvedValue({ resultado: "RECHAZADO", motivos: ["No pendiente"] });
    expect((await decidirPresupuestoAction("p-1", decision)).mensaje).toBe("No pendiente");
  });
  it.each(["APROBAR", "RECHAZAR"] as const)("decisión %s actualiza rutas ante éxito y devuelve conflicto", async (decision) => {
    mocks.obtenerUsuario.mockResolvedValue(cliente);
    mocks.decidir.mockResolvedValue({ resultado: "DECIDIDO" });
    expect(await decidirPresupuestoAction("p-1", decision)).toEqual({});
    expect(mocks.decidir).toHaveBeenCalledWith("p-1", "cliente-1", decision);
    expect(mocks.revalidate).toHaveBeenCalledWith("/ordenes-trabajo");
    mocks.decidir.mockRejectedValue(new Error("conflict"));
    expect((await decidirPresupuestoAction("p-1", decision)).mensaje).toContain("cambió");
  });
});
