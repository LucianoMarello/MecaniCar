import { NextResponse } from "next/server";
import {
  buscarEmailDelTurno,
  buscarTurnoParaValidarConfirmacion,
  marcarTurnoConfirmado,
} from "@/lib/db/turnos";
import { validarConfirmacionTurno } from "@/lib/turnos";
import { responderError } from "@/lib/errores";
import { requerirUsuario } from "@/lib/auth";
import { enviarNotificacion } from "@/lib/servicios/notificaciones";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Contexto) {
  try {
    const { id } = await params;
    await requerirUsuario("MECANICO");

  // 1. LEER
    const turnoActual = await buscarTurnoParaValidarConfirmacion(id);
    if (!turnoActual) {
      return NextResponse.json({ error: "El turno no existe" }, { status: 404 });
    }

  // 2. REGLA DE NEGOCIO
    const errores = validarConfirmacionTurno(turnoActual);
    if (errores.length > 0) {
      return NextResponse.json({ error: errores.join(". ") }, { status: 409 });
    }

  // 3. MUTAR
    const turnoConfirmado = await marcarTurnoConfirmado(id);
    const contacto = await buscarEmailDelTurno(id);

if (contacto) {
  await enviarNotificacion({
    destinatario: contacto.usuario.email,
    asunto: "Turno confirmado - MecaniCar",
    mensaje: `Tu turno ${id} fue confirmado por el taller.`,
  });
}
    return NextResponse.json(turnoConfirmado);
  } catch (error) {
    return responderError("POST /api/turnos/:id/confirmacion", error);
  }
}
