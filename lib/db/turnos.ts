import { prisma } from "@/lib/db/client";

export function listarTurnosDeCliente(usuarioId: string) {
  return prisma.turno.findMany({
    where: { usuarioId },
    select: {
      id: true,
      fechaHora: true,
      motivo: true,
      estado: true,
      fechaCreacion: true,
      vehiculo: {
        select: {
          id: true,
          patente: true,
          marca: true,
          modelo: true,
        },
      },
    },
    orderBy: { fechaHora: "asc" },
    take: 100,
  });
}
