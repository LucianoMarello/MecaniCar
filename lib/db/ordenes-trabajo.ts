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

export function listarOrdenes(usuarioId: string, rol: Rol) {
  return prisma.ordenTrabajo.findMany({
    where: rol === "CLIENTE" ? { vehiculo: { usuarioId } } : undefined,
    select: ordenSelect,
    orderBy: { fechaCreacion: "desc" },
    take: 100,
  });
}

export async function buscarOrden(id: string, usuarioId: string, rol: Rol) {
  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id },
    select: ordenSelect,
  });
  if (!orden) return { resultado: "NO_EXISTE" } as const;
  if (rol === "CLIENTE" && orden.vehiculo.usuarioId !== usuarioId)
    return { resultado: "PROHIBIDO" } as const;
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
  // Solo lee. Extrae exactamente lo que necesita la función pura.
  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id },
    select: {
      estado: true,
      presupuestos: {
        select: { estado: true },
      },
    },
  });
  return orden;
}

export async function marcarOrdenFinalizada(id: string) {
  // Mutación pura. Asume que la validación ya autorizó este cambio.
  const actualizada = await prisma.ordenTrabajo.update({
    where: { id },
    data: { estado: "FINALIZADA" },
    select: ordenSelect,
  });
  return actualizada;
}
