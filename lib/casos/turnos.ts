import {
  buscarTurnoParaIngreso,
  insertarOrdenDesdeTurno,
} from "@/lib/db/ordenes-trabajo";
import {
  buscarTurnoParaValidarCancelacion,
  buscarTurnoParaValidarConfirmacion,
  marcarTurnoCancelado,
  marcarTurnoConfirmado,
} from "@/lib/db/turnos";
import { enviarNotificacion } from "@/lib/servicios/notificaciones";
import {
  validarCancelacionTurno,
  validarConfirmacionTurno,
  validarIngresoTaller,
} from "@/lib/turnos";

// Pasos 3 y 4 de cada operación, compartidos por el Route Handler y la Server
// Action. Quien llama verifica la sesión, valida el id y traduce el resultado.

export async function confirmarTurno(id: string) {
  const turno = await buscarTurnoParaValidarConfirmacion(id);
  if (!turno) return { resultado: "NO_EXISTE" } as const;

  const motivos = validarConfirmacionTurno(turno);
  if (motivos.length > 0) return { resultado: "RECHAZADO", motivos } as const;

  const confirmado = await marcarTurnoConfirmado(id);

  // El aviso es accesorio (docs/spec.md, sección 9): enviarNotificacion no
  // lanza, y si el correo no sale el turno queda confirmado igual.
  const avisoEnviado = await enviarNotificacion({
    destinatario: turno.usuario.email,
    asunto: "Turno confirmado - MecaniCar",
    mensaje: `Tu turno ${id} fue confirmado por el taller.`,
  });
  return { resultado: "CONFIRMADO", turno: confirmado, avisoEnviado } as const;
}

// Solo encuentra los turnos de usuarioId: uno ajeno da NO_EXISTE, igual que
// uno que no existe, para no revelar que está.
export async function cancelarTurno(id: string, usuarioId: string) {
  const turno = await buscarTurnoParaValidarCancelacion(id, usuarioId);
  if (!turno) return { resultado: "NO_EXISTE" } as const;

  const motivos = validarCancelacionTurno(turno);
  if (motivos.length > 0) return { resultado: "RECHAZADO", motivos } as const;

  const cancelado = await marcarTurnoCancelado(id);
  return { resultado: "CANCELADO", turno: cancelado } as const;
}

export async function registrarIngreso(id: string) {
  const turno = await buscarTurnoParaIngreso(id);
  if (!turno) return { resultado: "NO_EXISTE" } as const;

  const motivos = validarIngresoTaller(turno);
  if (motivos.length > 0) return { resultado: "RECHAZADO", motivos } as const;

  const orden = await insertarOrdenDesdeTurno(id, turno.vehiculoId);
  return { resultado: "REGISTRADO", orden } as const;
}
