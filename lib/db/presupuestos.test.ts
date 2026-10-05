import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
const tx = vi.hoisted(() => ({ presupuesto: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), update: vi.fn() }, servicio: { findMany: vi.fn() }, detallePresupuesto: { deleteMany: vi.fn() }, ordenTrabajo: { update: vi.fn() } }));
vi.mock("@/lib/db/client", () => ({ prisma: { $transaction: (fn: (client: typeof tx) => unknown) => fn(tx) } }));
import { conTotal, editarPresupuesto, marcarPresupuestoAprobado } from "./presupuestos";
describe("presupuesto único", () => {
 beforeEach(() => vi.resetAllMocks());
 it("suma importes sin error de coma flotante", () => {
  expect(conTotal({ detalles: [{ precioAplicado: new Prisma.Decimal("0.1") }, { precioAplicado: new Prisma.Decimal("0.2") }] }).total).toBe("0.30");
 });
 it("una edición requiere nueva aprobación y conserva precios históricos", async () => {
  tx.presupuesto.findUnique.mockResolvedValue({ ordenTrabajoId: "orden", ordenTrabajo: { estado: "EN_REPARACION" }, detalles: [{ servicioId: "viejo", precioAplicado: new Prisma.Decimal(10) }] });
  tx.servicio.findMany.mockResolvedValue([{ id: "viejo", precioActual: new Prisma.Decimal(99) }, { id: "nuevo", precioActual: new Prisma.Decimal(20) }]);
  tx.presupuesto.update.mockResolvedValue({ detalles: [{ precioAplicado: new Prisma.Decimal(10) }, { precioAplicado: new Prisma.Decimal(20) }] });
  expect((await editarPresupuesto("presupuesto", ["viejo", "nuevo"]))?.total).toBe("30.00");
  expect(tx.ordenTrabajo.update).toHaveBeenCalledWith({ where: { id: "orden" }, data: { estado: "ABIERTA" } });
  expect(tx.presupuesto.update.mock.calls[0]![0].data.estado).toBe("PENDIENTE");
  expect(tx.presupuesto.update.mock.calls[0]![0].data.detalles.create[0].precioAplicado.toString()).toBe("10");
 });
 it("no edita una orden finalizada", async () => {
  tx.presupuesto.findUnique.mockResolvedValue({ ordenTrabajo: { estado: "FINALIZADA" } });
  await expect(editarPresupuesto("presupuesto", ["servicio"])).rejects.toThrow("finalizada");
  expect(tx.detallePresupuesto.deleteMany).not.toHaveBeenCalled();
 });
 it("no reabre una orden finalizada al aprobar", async () => {
  tx.presupuesto.findUniqueOrThrow.mockResolvedValue({ estado: "PENDIENTE", ordenTrabajo: { estado: "FINALIZADA" } });
  await expect(marcarPresupuestoAprobado("presupuesto", "orden")).rejects.toThrow();
  expect(tx.ordenTrabajo.update).not.toHaveBeenCalled();
 });
});
