import { ConflictoNegocio } from "../errores";
import { Prisma } from "@prisma/client";
import type { Paginacion } from "@/lib/schemas/http";
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
export async function listarPresupuestos(
  usuarioId: string,
  rol: Rol,
  paginacion: Paginacion = { pagina: 1, limite: 20 },
) {
  const presupuestos = await prisma.presupuesto.findMany({
    where:
      rol === "CLIENTE"
        ? { ordenTrabajo: { vehiculo: { usuarioId } } }
        : undefined,
    select: presupuestoSelect,
    orderBy: { fechaCreacion: "desc" },
    skip: (paginacion.pagina - 1) * paginacion.limite,
    take: paginacion.limite,
  });
  return presupuestos.map(conTotal);
}
export async function buscarPresupuesto(
  id: string,
  usuarioId: string,
  rol: Rol,
) {
  const presupuesto = await prisma.presupuesto.findFirst({
    where: {
      id,
      ...(rol === "CLIENTE"
        ? { ordenTrabajo: { vehiculo: { usuarioId } } }
        : {}),
    },
    select: presupuestoSelect,
  });
  if (!presupuesto) return { resultado: "NO_EXISTE" } as const;
  return { resultado: "OK", presupuesto: conTotal(presupuesto) } as const;
}
export async function buscarOrdenYServiciosParaPresupuesto(
  ordenId: string,
  serviciosIds: string[],
) {
  // Solo lee. Trae la orden y los servicios solicitados para ver si existen y cuánto valen.
  // El email del cliente se trae acá para avisarle sin consultar la base después de crear.
  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id: ordenId },
    select: {
      estado: true,
      turno: { select: { usuario: { select: { email: true } } } },
    },
  });
  const idsUnicos = [...new Set(serviciosIds)];
  const servicios = await prisma.servicio.findMany({
    where: { id: { in: idsUnicos } },
    select: { id: true, precioActual: true },
  });
  return { orden, servicios, idsUnicos };
}
export function conTotal<
  T extends {
    detalles: {
      precioAplicado: Decimal;
    }[];
  },
>(presupuesto: T) {
  return {
    ...presupuesto,
    total: presupuesto.detalles
      .reduce((suma, d) => suma.plus(d.precioAplicado), new Prisma.Decimal(0))
      .toFixed(2),
  };
}
export async function insertarPresupuesto(
  ordenTrabajoId: string,
  servicios: {
    id: string;
    precioActual: Decimal;
  }[],
) {
  return prisma.$transaction(
    async (tx) => {
      const existente = await tx.presupuesto.findUnique({
        where: { ordenTrabajoId },
        select: { id: true },
      });
      if (existente)
        throw new ConflictoNegocio("La orden ya tiene un presupuesto");
      const orden = await tx.ordenTrabajo.findUniqueOrThrow({
        where: { id: ordenTrabajoId },
      });
      if (orden.estado === "FINALIZADA")
        throw new ConflictoNegocio(
          "No se puede presupuestar una orden finalizada",
        );
      return conTotal(
        await tx.presupuesto.create({
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
        }),
      );
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
export async function editarPresupuesto(id: string, serviciosIds: string[]) {
  return prisma.$transaction(
    async (tx) => {
      const actual = await tx.presupuesto.findUnique({
        where: { id },
        include: { ordenTrabajo: true, detalles: true },
      });
      if (!actual) return null;
      if (actual.ordenTrabajo.estado === "FINALIZADA")
        throw new ConflictoNegocio(
          "No se puede editar el presupuesto de una orden finalizada",
        );
      const ids = [...new Set(serviciosIds)];
      const servicios = await tx.servicio.findMany({
        where: { id: { in: ids } },
      });
      if (servicios.length !== ids.length)
        throw new ConflictoNegocio("Alguno de los servicios no existe");
      // Los servicios conservados mantienen su precio histórico; los nuevos usan el precio actual.
      await tx.detallePresupuesto.deleteMany({ where: { presupuestoId: id } });
      await tx.ordenTrabajo.update({
        where: { id: actual.ordenTrabajoId },
        data: { estado: "ABIERTA" },
      });
      return conTotal(
        await tx.presupuesto.update({
          where: { id },
          data: {
            estado: "PENDIENTE",
            detalles: {
              create: servicios.map((s) => ({
                servicioId: s.id,
                precioAplicado:
                  actual.detalles.find((d) => d.servicioId === s.id)
                    ?.precioAplicado ?? s.precioActual,
              })),
            },
          },
          select: presupuestoSelect,
        }),
      );
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
export async function buscarPresupuestoParaValidar(
  id: string,
  usuarioId: string,
) {
  return prisma.presupuesto.findFirst({
    where: { id, ordenTrabajo: { vehiculo: { usuarioId } } },
    select: {
      estado: true,
      ordenTrabajoId: true,
      ordenTrabajo: {
        select: {
          estado: true,
          vehiculo: { select: { usuarioId: true } },
        },
      },
    },
  });
}
export async function marcarPresupuestoRechazado(id: string) {
  return prisma.$transaction(
    async (tx) => {
      const actual = await tx.presupuesto.findUniqueOrThrow({
        where: { id },
        include: { ordenTrabajo: true },
      });
      if (
        actual.estado !== "PENDIENTE" ||
        actual.ordenTrabajo.estado === "FINALIZADA"
      )
        throw new ConflictoNegocio(
          "El presupuesto no puede rechazarse en su estado actual",
        );
      return conTotal(
        await tx.presupuesto.update({
          where: { id },
          data: { estado: "RECHAZADO" },
          select: presupuestoSelect,
        }),
      );
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
export async function marcarPresupuestoAprobado(
  presupuestoId: string,
  ordenTrabajoId: string,
) {
  return prisma.$transaction(
    async (tx) => {
      const actual = await tx.presupuesto.findUniqueOrThrow({
        where: { id: presupuestoId },
        include: { ordenTrabajo: true },
      });
      if (
        actual.estado !== "PENDIENTE" ||
        actual.ordenTrabajo.estado === "FINALIZADA"
      )
        throw new ConflictoNegocio(
          "El presupuesto no puede aprobarse en su estado actual",
        );
      await tx.ordenTrabajo.update({
        where: { id: ordenTrabajoId },
        data: { estado: "EN_REPARACION" },
      });
      return conTotal(
        await tx.presupuesto.update({
          where: { id: presupuestoId },
          data: { estado: "APROBADO" },
          select: presupuestoSelect,
        }),
      );
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
export async function buscarDestinatarioPresupuesto(id: string) {
  const presupuesto = await prisma.presupuesto.findUnique({
    where: { id },
    select: {
      ordenTrabajo: {
        select: { turno: { select: { usuario: { select: { email: true } } } } },
      },
    },
  });
  return presupuesto?.ordenTrabajo.turno.usuario.email;
}
