import { prisma } from "@/lib/db/client";
import type { Rol } from "@prisma/client";
import type { PresupuestoInput } from "@/lib/schemas/presupuesto";

const presupuestoSelect = {
  id: true, estado: true, fechaCreacion: true,
  ordenTrabajo: { select: { id: true, estado: true, vehiculo: { select: { usuarioId: true, patente: true } } } },
  detalles: { select: { id: true, precioAplicado: true, servicio: { select: { id: true, nombre: true } } } },
} as const;

export function listarPresupuestos(usuarioId: string, rol: Rol) {
  return prisma.presupuesto.findMany({ where: rol === "CLIENTE" ? { ordenTrabajo: { vehiculo: { usuarioId } } } : undefined, select: presupuestoSelect, orderBy: { fechaCreacion: "desc" }, take: 100 });
}

export async function buscarPresupuesto(id: string, usuarioId: string, rol: Rol) {
  const presupuesto = await prisma.presupuesto.findUnique({ where: { id }, select: presupuestoSelect });
  if (!presupuesto) return { resultado: "NO_EXISTE" } as const;
  if (rol === "CLIENTE" && presupuesto.ordenTrabajo.vehiculo.usuarioId !== usuarioId) return { resultado: "PROHIBIDO" } as const;
  return { resultado: "OK", presupuesto } as const;
}

export async function crearPresupuesto(datos: PresupuestoInput) {
  const orden = await prisma.ordenTrabajo.findUnique({ where: { id: datos.ordenTrabajoId }, select: { estado: true } });
  if (!orden) return { resultado: "ORDEN_NO_EXISTE" } as const;
  if (orden.estado === "FINALIZADA") return { resultado: "ORDEN_FINALIZADA" } as const;
  const ids = [...new Set(datos.serviciosIds)];
  const servicios = await prisma.servicio.findMany({ where: { id: { in: ids } }, select: { id: true, precioActual: true }, take: ids.length });
  if (servicios.length !== ids.length) return { resultado: "SERVICIO_NO_EXISTE" } as const;
  const presupuesto = await prisma.presupuesto.create({
    data: { ordenTrabajoId: datos.ordenTrabajoId, detalles: { create: servicios.map((servicio) => ({ servicioId: servicio.id, precioAplicado: servicio.precioActual })) } },
    select: presupuestoSelect,
  });
  return { resultado: "CREADO", presupuesto } as const;
}

export async function rechazarPresupuesto(id: string, usuarioId: string) {
  const acceso = await buscarPresupuesto(id, usuarioId, "CLIENTE");
  if (acceso.resultado !== "OK") return acceso;
  if (acceso.presupuesto.estado !== "PENDIENTE") return { resultado: "ESTADO_INVALIDO" } as const;
  const presupuesto = await prisma.presupuesto.update({ where: { id }, data: { estado: "RECHAZADO" }, select: presupuestoSelect });
  return { resultado: "RECHAZADO", presupuesto } as const;
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

export async function aprobarPresupuesto(
  id: string,
  usuarioId: string,
) {
  return prisma.$transaction(async (tx) => {
    const presupuesto = await tx.presupuesto.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
        ordenTrabajoId: true,
        ordenTrabajo: {
          select: {
            vehiculo: {
              select: { usuarioId: true },
            },
          },
        },
      },
    });

    if (!presupuesto) return { resultado: "NO_EXISTE" } as const;
    if (presupuesto.ordenTrabajo.vehiculo.usuarioId !== usuarioId) {
      return { resultado: "PROHIBIDO" } as const;
    }
    if (presupuesto.estado !== "PENDIENTE") {
      return { resultado: "ESTADO_INVALIDO" } as const;
    }

    await tx.ordenTrabajo.update({
      where: { id: presupuesto.ordenTrabajoId },
      data: { estado: "EN_REPARACION" },
    });

    const actualizado = await tx.presupuesto.update({
      where: { id },
      data: { estado: "APROBADO" },
      select: presupuestoAprobadoSelect,
    });

    return { resultado: "APROBADO", presupuesto: actualizado } as const;
  });
}
