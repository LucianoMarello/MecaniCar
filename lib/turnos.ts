import type { EstadoTurno } from "@prisma/client";

type DatosTurnoConfirmacion = {
  estado: EstadoTurno;
};

export function validarConfirmacionTurno(
  turno: DatosTurnoConfirmacion,
): string[] {
  const errores: string[] = [];
  if (turno.estado !== "PENDIENTE") {
    errores.push("Solo puede confirmarse un turno pendiente");
  }
  return errores;
}

type DatosTurnoCancelacion = {
  estado: EstadoTurno;
  ordenTrabajo: { id: string } | null;
};

export function validarCancelacionTurno(
  turno: DatosTurnoCancelacion,
): string[] {
  const errores: string[] = [];

  if (turno.estado === "CANCELADO") {
    errores.push("El turno ya se encuentra cancelado");
  }
  if (turno.ordenTrabajo !== null) {
    errores.push(
      "No se puede cancelar un turno que ya ingresó al taller (tiene orden de trabajo)",
    );
  }

  return errores;
}

type DatosTurnoIngreso = {
  estado: EstadoTurno;
  ordenTrabajo: { id: string } | null;
};

export function validarIngresoTaller(turno: DatosTurnoIngreso): string[] {
  const errores: string[] = [];

  if (turno.estado !== "CONFIRMADO") {
    errores.push("El turno debe estar CONFIRMADO para registrar el ingreso");
  }
  if (turno.ordenTrabajo !== null) {
    errores.push("Este turno ya tiene una orden de trabajo asociada");
  }

  return errores;
}
