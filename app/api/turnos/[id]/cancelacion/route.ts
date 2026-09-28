import { NextResponse } from "next/server";
import { requerirUsuario } from "@/lib/auth";
import {
  buscarTurnoParaValidarCancelacion,
  marcarTurnoCancelado,
} from "@/lib/db/turnos";
import { validarCancelacionTurno } from "@/lib/turnos";
import { responderError } from "@/lib/errores";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Contexto) {
  try {
    const { id } = await params;
    const sesion = await requerirUsuario("CLIENTE");

  // 1. LEER
    const turnoActual = await buscarTurnoParaValidarCancelacion(id, sesion.id);
    if (!turnoActual) {
      return NextResponse.json({ error: "El turno no existe" }, { status: 404 });
    }

  // 2. REGLA DE NEGOCIO
    const errores = validarCancelacionTurno(turnoActual);
    if (errores.length > 0) {
      return NextResponse.json({ error: errores.join(". ") }, { status: 409 });
    }

  // 3. MUTAR
    const turnoCancelado = await marcarTurnoCancelado(id);
    return NextResponse.json(turnoCancelado);
  } catch (error) {
    return responderError("POST /api/turnos/:id/cancelacion", error);
  }
}
