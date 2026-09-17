import { prisma } from "@/lib/db/client";

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
