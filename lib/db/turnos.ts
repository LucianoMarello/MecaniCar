import type { Rol } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import type { TurnoInput } from "@/lib/schemas/turno";

const turnoSelect = {
  id: true, usuarioId: true, fechaHora: true, motivo: true, estado: true, fechaCreacion: true,
  vehiculo: { select: { id: true, patente: true, marca: true, modelo: true } },
  ordenTrabajo: { select: { id: true } },
} as const;

export function listarTurnos(usuarioId: string, rol: Rol) {
  return prisma.turno.findMany({
    where: rol === "CLIENTE" ? { usuarioId } : undefined,
    select: turnoSelect, orderBy: { fechaHora: "asc" }, take: 100,
  });
}

export async function buscarTurno(id: string, usuarioId: string, rol: Rol) {
  const turno = await prisma.turno.findUnique({ where: { id }, select: turnoSelect });
  if (!turno) return { resultado: "NO_EXISTE" } as const;
  if (rol === "CLIENTE" && turno.usuarioId !== usuarioId) return { resultado: "PROHIBIDO" } as const;
  return { resultado: "OK", turno } as const;
}

export async function crearTurno(datos: TurnoInput, usuarioId: string) {
  const vehiculo = await prisma.vehiculo.findUnique({ where: { id: datos.vehiculoId }, select: { usuarioId: true } });
  if (!vehiculo) return { resultado: "VEHICULO_NO_EXISTE" } as const;
  if (vehiculo.usuarioId !== usuarioId) return { resultado: "PROHIBIDO" } as const;
  const turno = await prisma.turno.create({ data: { ...datos, usuarioId }, select: turnoSelect });
  return { resultado: "CREADO", turno } as const;
}

export async function confirmarTurno(id: string) {
  const turno = await prisma.turno.findUnique({ where: { id }, select: { estado: true } });
  if (!turno) return { resultado: "NO_EXISTE" } as const;
  if (turno.estado !== "PENDIENTE") return { resultado: "ESTADO_INVALIDO" } as const;
  const actualizado = await prisma.turno.update({ where: { id }, data: { estado: "CONFIRMADO" }, select: turnoSelect });
  return { resultado: "CONFIRMADO", turno: actualizado } as const;
}

export async function cancelarTurno(id: string, usuarioId: string) {
  const turno = await prisma.turno.findUnique({ where: { id }, select: { usuarioId: true, estado: true, ordenTrabajo: { select: { id: true } } } });
  if (!turno) return { resultado: "NO_EXISTE" } as const;
  if (turno.usuarioId !== usuarioId) return { resultado: "PROHIBIDO" } as const;
  if (turno.estado === "CANCELADO" || turno.ordenTrabajo) return { resultado: "ESTADO_INVALIDO" } as const;

  const cambio = await prisma.turno.updateMany({
    where: {
      id,
      usuarioId,
      estado: { not: "CANCELADO" },
      ordenTrabajo: { is: null },
    },
    data: { estado: "CANCELADO" },
  });

  if (cambio.count === 0) return { resultado: "ESTADO_INVALIDO" } as const;

  const actualizado = await prisma.turno.findUniqueOrThrow({
    where: { id },
    select: turnoSelect,
  });
  return { resultado: "CANCELADO", turno: actualizado } as const;
}
