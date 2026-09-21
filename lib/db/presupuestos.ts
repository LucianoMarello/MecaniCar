import { prisma } from "@/lib/db/client";
import type { Rol } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";

const presupuestoSelect = {
  id: true,
  estado: true,
  fechaCreacion: true,
  ordenTrabajo: {
    select: {
      id: true,
      estado: true,
      vehiculo: { select: { usuarioId: true, patente: true } },
    },
  },
  detalles: {
    select: {
      id: true,
      precioAplicado: true,
      servicio: { select: { id: true, nombre: true } },
    },
  },
} as const;

export function listarPresupuestos(usuarioId: string, rol: Rol) {
  return prisma.presupuesto.findMany({
    where:
      rol === "CLIENTE"
        ? { ordenTrabajo: { vehiculo: { usuarioId } } }
        : undefined,
    select: presupuestoSelect,
    orderBy: { fechaCreacion: "desc" },
    take: 100,
  });
}

export async function buscarPresupuesto(
  id: string,
  usuarioId: string,
  rol: Rol,
) {
  const presupuesto = await prisma.presupuesto.findUnique({
    where: { id },
    select: presupuestoSelect,
  });
  if (!presupuesto) return { resultado: "NO_EXISTE" } as const;
  if (
    rol === "CLIENTE" &&
    presupuesto.ordenTrabajo.vehiculo.usuarioId !== usuarioId
  )
    return { resultado: "PROHIBIDO" } as const;
  return { resultado: "OK", presupuesto } as const;
}

export async function buscarOrdenYServiciosParaPresupuesto(
  ordenId: string,
  serviciosIds: string[],
) {
  // Solo lee. Trae la orden y los servicios solicitados para ver si existen y cuánto valen.
  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id: ordenId },
    select: { estado: true },
  });

  const idsUnicos = [...new Set(serviciosIds)];
  const servicios = await prisma.servicio.findMany({
    where: { id: { in: idsUnicos } },
    select: { id: true, precioActual: true },
  });

  return { orden, servicios, idsUnicos };
}

export async function insertarPresupuesto(
  ordenTrabajoId: string,
  servicios: { id: string; precioActual: Decimal }[],
) {
  // Mutación pura. Inserta el presupuesto y sus detalles con los precios actuales congelados.
  return prisma.presupuesto.create({
    data: {
      ordenTrabajoId,
      detalles: {
        create: servicios.map((s) => ({
          servicioId: s.id,
          precioAplicado: s.precioActual,
        })),
      },
    },
    select: presupuestoSelect,
  });
}

export async function buscarPresupuestoParaValidar(id: string) {
  // Solo lee.
  return prisma.presupuesto.findUnique({
    where: { id },
    select: {
      estado: true,
      ordenTrabajoId: true,
      ordenTrabajo: {
        select: {
          vehiculo: { select: { usuarioId: true } },
        },
      },
    },
  });
}

export async function marcarPresupuestoRechazado(id: string) {
  // Solo escribe. Asume que la función pura ya dio el OK.
  return prisma.presupuesto.update({
    where: { id },
    data: { estado: "RECHAZADO" },
    select: presupuestoSelect,
  });
}

const presupuestoAprobadoSelect = {
  id: true,
  estado: true,
  fechaCreacion: true,
  ordenTrabajo: {
    select: {
      id: true,
      estado: true,
    },
  },
} as const;

export async function marcarPresupuestoAprobado(
  presupuestoId: string,
  ordenTrabajoId: string,
) {
  // Transacción: Si falla una de las dos escrituras, se cancela todo.
  return prisma.$transaction(async (tx) => {
    await tx.ordenTrabajo.update({
      where: { id: ordenTrabajoId },
      data: { estado: "EN_REPARACION" },
    });

    return tx.presupuesto.update({
      where: { id: presupuestoId },
      data: { estado: "APROBADO" },
      select: presupuestoAprobadoSelect, // Ya existe arriba en tu archivo
    });
  });
}
