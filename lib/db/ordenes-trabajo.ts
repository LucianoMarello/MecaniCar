import { Prisma } from "@prisma/client";
import { ConflictoNegocio } from "./presupuestos";
import type { Paginacion } from "@/lib/schemas/http";
import type { Rol } from "@prisma/client";
import { prisma } from "@/lib/db/client";

const ordenSelect = {
  id: true,
  turnoId: true,
  vehiculoId: true,
  fechaIngreso: true,
  estado: true,
  fechaCreacion: true,
  vehiculo: {
    select: { patente: true, marca: true, modelo: true, usuarioId: true },
  },
} as const;

export function listarOrdenes(usuarioId: string, rol: Rol, paginacion: Paginacion = { pagina: 1, limite: 20 }) {
  return prisma.ordenTrabajo.findMany({
    where: rol === "CLIENTE" ? { vehiculo: { usuarioId } } : undefined,
    select: ordenSelect,
    orderBy: { fechaCreacion: "desc" },
    skip: (paginacion.pagina - 1) * paginacion.limite, take: paginacion.limite,
  });
}

export async function buscarOrden(id: string, usuarioId: string, rol: Rol) {
  const orden = await prisma.ordenTrabajo.findFirst({
    where: {
      id,
      ...(rol === "CLIENTE" ? { vehiculo: { usuarioId } } : {}),
    },
    select: ordenSelect,
  });
  if (!orden) return { resultado: "NO_EXISTE" } as const;
  return { resultado: "OK", orden } as const;
}

export async function buscarTurnoParaIngreso(turnoId: string) {
  // Solo lee los datos del turno que el negocio necesita evaluar
  return prisma.turno.findUnique({
    where: { id: turnoId },
    select: {
      estado: true,
      vehiculoId: true,
      ordenTrabajo: { select: { id: true } },
    },
  });
}

export async function insertarOrdenDesdeTurno(
  turnoId: string,
  vehiculoId: string,
) {
  // Mutación pura
  return prisma.ordenTrabajo.create({
    data: { turnoId, vehiculoId, fechaIngreso: new Date(), estado: "ABIERTA" },
    select: ordenSelect,
  });
}

export async function buscarOrdenParaValidar(id: string) {
  // Solo lee. Extrae lo que necesita la función pura y el email del cliente,
  // para avisarle sin consultar la base después de finalizar.
  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id },
    select: {
      estado: true,
      presupuestos: {
        select: { estado: true },
      },
      turno: { select: { usuario: { select: { email: true } } } },
    },
  });
  return orden;
}

export async function marcarOrdenFinalizada(id: string) {
 return prisma.$transaction(async tx => {
  const actual = await tx.ordenTrabajo.findUniqueOrThrow({ where: { id }, include: { presupuestos: true } });
  if (actual.estado !== "EN_REPARACION" || !actual.presupuestos.some(p => p.estado === "APROBADO")) throw new ConflictoNegocio("La orden debe estar en reparación y tener presupuesto aprobado");
  return tx.ordenTrabajo.update({ where: { id }, data: { estado: "FINALIZADA" }, select: ordenSelect });
 }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
