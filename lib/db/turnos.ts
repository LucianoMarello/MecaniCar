import type { Rol } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import type { TurnoInput } from "@/lib/schemas/turno";

const turnoSelect = {
  id: true,
  usuarioId: true,
  fechaHora: true,
  motivo: true,
  estado: true,
  fechaCreacion: true,
  vehiculo: { select: { id: true, patente: true, marca: true, modelo: true } },
  ordenTrabajo: { select: { id: true } },
} as const;

export function listarTurnos(usuarioId: string, rol: Rol) {
  return prisma.turno.findMany({
    where: rol === "CLIENTE" ? { usuarioId } : undefined,
    select: turnoSelect,
    orderBy: { fechaHora: "asc" },
    take: 100,
  });
}

export async function buscarTurno(id: string, usuarioId: string, rol: Rol) {
  const turno = await prisma.turno.findFirst({
    where: { id, ...(rol === "CLIENTE" ? { usuarioId } : {}) },
    select: turnoSelect,
  });
  if (!turno) return { resultado: "NO_EXISTE" } as const;
  return { resultado: "OK", turno } as const;
}

export async function crearTurno(datos: TurnoInput, usuarioId: string) {
  const vehiculo = await prisma.vehiculo.findFirst({
    where: { id: datos.vehiculoId, usuarioId },
    select: { id: true },
  });
  if (!vehiculo) return { resultado: "VEHICULO_NO_EXISTE" } as const;
  const turno = await prisma.turno.create({
    data: { ...datos, usuarioId },
    select: turnoSelect,
  });
  return { resultado: "CREADO", turno } as const;
}

export async function buscarTurnoParaValidarConfirmacion(id: string) {
  // Solo lee para confirmar
  return prisma.turno.findUnique({
    where: { id },
    select: { estado: true },
  });
}

export async function buscarTurnoParaValidarCancelacion(
  id: string,
  usuarioId: string,
) {
  return prisma.turno.findFirst({
    where: { id, usuarioId },
    select: {
      estado: true,
      usuarioId: true,
      ordenTrabajo: { select: { id: true } },
    },
  });
}

export async function marcarTurnoConfirmado(id: string) {
  // Solo escribe confirmación
  return prisma.turno.update({
    where: { id },
    data: { estado: "CONFIRMADO" },
    select: turnoSelect,
  });
}

export async function marcarTurnoCancelado(id: string) {
  // Solo escribe cancelación
  return prisma.turno.update({
    where: { id },
    data: { estado: "CANCELADO" },
    select: turnoSelect,
  });
}
