import type { Paginacion } from "@/lib/schemas/http";
import { Prisma, type Rol } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { ConflictoNegocio } from "@/lib/errores";
import type { TurnoInput } from "@/lib/schemas/turno";
import { validarCancelacionTurno, validarConfirmacionTurno } from "@/lib/turnos";

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

export function listarTurnos(usuarioId: string, rol: Rol, paginacion: Paginacion = { pagina: 1, limite: 20 }) {
  return prisma.turno.findMany({
    where: rol === "CLIENTE" ? { usuarioId } : undefined,
    select: turnoSelect,
    orderBy: { fechaHora: "asc" },
    skip: (paginacion.pagina - 1) * paginacion.limite, take: paginacion.limite,
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
  // Solo lee para confirmar. El email del cliente se trae acá, antes de
  // confirmar, para no consultar la base después de la operación.
  return prisma.turno.findUnique({
    where: { id },
    select: { estado: true, usuario: { select: { email: true } } },
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

// Las dos escrituras vuelven a aplicar la regla en una transacción
// serializable: si otro pedido cambió el turno después de leerlo, no lo pisan
// y responden 409 con el mismo texto que la regla.
export async function marcarTurnoConfirmado(id: string) {
  return prisma.$transaction(
    async (tx) => {
      const actual = await tx.turno.findUniqueOrThrow({
        where: { id },
        select: { estado: true },
      });
      const motivos = validarConfirmacionTurno(actual);
      if (motivos.length > 0) throw new ConflictoNegocio(motivos.join(". "));
      return tx.turno.update({
        where: { id },
        data: { estado: "CONFIRMADO" },
        select: turnoSelect,
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function marcarTurnoCancelado(id: string) {
  return prisma.$transaction(
    async (tx) => {
      const actual = await tx.turno.findUniqueOrThrow({
        where: { id },
        select: { estado: true, ordenTrabajo: { select: { id: true } } },
      });
      const motivos = validarCancelacionTurno(actual);
      if (motivos.length > 0) throw new ConflictoNegocio(motivos.join(". "));
      return tx.turno.update({
        where: { id },
        data: { estado: "CANCELADO" },
        select: turnoSelect,
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
