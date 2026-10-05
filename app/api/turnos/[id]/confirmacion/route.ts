import { idSchema } from "@/lib/schemas/http";
import { NextResponse } from "next/server";
import {
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
    await requerirUsuario("MECANICO");
    const id = idSchema.parse((await params).id);


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

    // 4. AVISAR AL CLIENTE. Resend es accesorio (docs/spec.md, sección 9):
    // de acá para abajo nada puede lanzar. Si el correo falla,
    // enviarNotificacion devuelve false y se responde igual.
    await enviarNotificacion({
      destinatario: turnoActual.usuario.email,
      asunto: "Turno confirmado - MecaniCar",
      mensaje: `Tu turno ${id} fue confirmado por el taller.`,
    });
    return NextResponse.json(turnoConfirmado);
  } catch (error) {
    return responderError("POST /api/turnos/:id/confirmacion", error);
  }
}
