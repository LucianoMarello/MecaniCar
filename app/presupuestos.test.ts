import { isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  obtenerUsuario: vi.fn(),
  listarPresupuestos: vi.fn(),
  contarPresupuestos: vi.fn(),
  buscarPresupuesto: vi.fn(),
  listarServicios: vi.fn(),
  crearPresupuesto: vi.fn(),
  actualizarPresupuesto: vi.fn(),
  decidirPresupuesto: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`); }),
  notFound: vi.fn(() => { throw new Error("NOT_FOUND"); }),
}));

vi.mock("@/lib/auth", () => ({ obtenerUsuario: mocks.obtenerUsuario }));
vi.mock("@/lib/db/presupuestos", () => ({
  listarPresupuestos: mocks.listarPresupuestos,
  contarPresupuestos: mocks.contarPresupuestos,
  buscarPresupuesto: mocks.buscarPresupuesto,
}));
vi.mock("@/lib/db/servicios", () => ({ listarServicios: mocks.listarServicios }));
vi.mock("@/lib/casos/presupuestos", () => ({
  crearPresupuesto: mocks.crearPresupuesto,
  actualizarPresupuesto: mocks.actualizarPresupuesto,
  decidirPresupuesto: mocks.decidirPresupuesto,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound,
}));
vi.mock("@/components/EstadoTrabajo", () => ({ EstadoTrabajo: () => null }));
vi.mock("@/components/ui/card", () => ({
  Card: (props: Record<string, unknown>) => props.children ?? null,
  CardContent: (props: Record<string, unknown>) => props.children ?? null,
  CardHeader: (props: Record<string, unknown>) => props.children ?? null,
  CardTitle: (props: Record<string, unknown>) => props.children ?? null,
}));
vi.mock("@/components/ui/button", () => ({ Button: (props: Record<string, unknown>) => props.children ?? null }));
vi.mock("@/components/ui/alert", () => ({
  Alert: (props: Record<string, unknown>) => props.children ?? null,
  AlertTitle: (props: Record<string, unknown>) => props.children ?? null,
  AlertDescription: (props: Record<string, unknown>) => props.children ?? null,
}));
vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: (props: Record<string, unknown>) => props.children ?? null,
  AlertDialogCancel: () => null,
  AlertDialogContent: (props: Record<string, unknown>) => props.children ?? null,
  AlertDialogDescription: (props: Record<string, unknown>) => props.children ?? null,
  AlertDialogFooter: (props: Record<string, unknown>) => props.children ?? null,
  AlertDialogHeader: (props: Record<string, unknown>) => props.children ?? null,
  AlertDialogTitle: (props: Record<string, unknown>) => props.children ?? null,
  AlertDialogTrigger: (props: Record<string, unknown>) => props.children ?? null,
}));

import Presupuestos from "./(app)/presupuestos/page";
import DetallePresupuesto from "./(app)/presupuestos/[id]/page";
import { decidirPresupuestoAction } from "./(app)/presupuestos/acciones";

const cliente = { id: "cliente-1", email: "c@example.com", nombre: "C", rol: "CLIENTE" };
const mecanico = { id: "mecanico-1", email: "m@example.com", nombre: "M", rol: "MECANICO" };
const parametros = (pagina?: string) => ({ searchParams: Promise.resolve(pagina ? { pagina } : {}) });

function contieneHref(nodo: unknown, href: string): boolean {
  if (Array.isArray(nodo)) return nodo.some((hijo) => contieneHref(hijo, href));
  if (!isValidElement(nodo)) return false;
  const props = nodo.props as Record<string, unknown>;
  return props.href === href || contieneHref(props.children, href);
}

describe("pantallas de presupuestos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.obtenerUsuario.mockResolvedValue(cliente);
    mocks.listarPresupuestos.mockResolvedValue([]);
    mocks.contarPresupuestos.mockResolvedValue(0);
    mocks.listarServicios.mockResolvedValue([]);
  });

  it("el listado requiere autenticación antes de consultar", async () => {
    mocks.obtenerUsuario.mockResolvedValue(null);
    await expect(Presupuestos(parametros())).rejects.toThrow("REDIRECT:/ingresar");
    expect(mocks.listarPresupuestos).not.toHaveBeenCalled();
  });

  it("el listado utiliza exclusivamente la identidad y rol de sesión", async () => {
    await Presupuestos({ searchParams: Promise.resolve({ pagina: "2", usuarioId: "ajeno", rol: "ADMIN" }) });
    expect(mocks.listarPresupuestos).toHaveBeenCalledWith("cliente-1", "CLIENTE", { pagina: 2, limite: 20 });
    expect(mocks.contarPresupuestos).toHaveBeenCalledWith("cliente-1", "CLIENTE");
  });

  it.each([[20, false], [21, true], [40, true], [41, true]])(
    "paginación con %i registros: siguiente=%s",
    async (total, siguiente) => {
      mocks.contarPresupuestos.mockResolvedValue(total);
      const pagina = await Presupuestos(parametros());
      expect(contieneHref(pagina, "/presupuestos?pagina=2")).toBe(siguiente);
    },
  );

  it("una página inválida no consulta el almacenamiento", async () => {
    await expect(Presupuestos(parametros("0"))).rejects.toThrow("NOT_FOUND");
    expect(mocks.listarPresupuestos).not.toHaveBeenCalled();
  });

  it("el detalle valida sesión y no consulta sin autenticación", async () => {
    mocks.obtenerUsuario.mockResolvedValue(null);
    await expect(DetallePresupuesto({ params: Promise.resolve({ id: "presupuesto-1" }), searchParams: Promise.resolve({}) })).rejects.toThrow("REDIRECT:/ingresar");
    expect(mocks.buscarPresupuesto).not.toHaveBeenCalled();
  });

  it("un id inválido no llega a buscarPresupuesto", async () => {
    await expect(DetallePresupuesto({ params: Promise.resolve({ id: "../x" }), searchParams: Promise.resolve({}) })).rejects.toThrow("NOT_FOUND");
    expect(mocks.buscarPresupuesto).not.toHaveBeenCalled();
  });

  it("un presupuesto ajeno o inexistente produce el mismo 404, pasando id/usuario/rol", async () => {
    mocks.buscarPresupuesto.mockResolvedValue({ resultado: "NO_EXISTE" });
    await expect(DetallePresupuesto({ params: Promise.resolve({ id: "presupuesto-ajeno" }), searchParams: Promise.resolve({}) })).rejects.toThrow("NOT_FOUND");
    expect(mocks.buscarPresupuesto).toHaveBeenCalledWith("presupuesto-ajeno", "cliente-1", "CLIENTE");
  });

  it("el cliente no puede usar la acción para decidir un presupuesto", async () => {
    mocks.obtenerUsuario.mockResolvedValue(mecanico);
    await expect(decidirPresupuestoAction("id-1", "APROBAR")).resolves.toMatchObject({ mensaje: expect.any(String) });
    expect(mocks.decidirPresupuesto).not.toHaveBeenCalled();
  });
});
