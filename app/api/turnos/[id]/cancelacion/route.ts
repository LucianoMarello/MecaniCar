import { NextResponse } from "next/server";
import { obtenerSesionDemo } from "@/lib/auth-demo";
import {
  buscarTurnoParaValidarCancelacion,
  marcarTurnoCancelado,
} from "@/lib/db/turnos";
import { validarCancelacionTurno } from "@/lib/turnos";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Contexto) {
  const { id } = await params;
  const sesion = obtenerSesionDemo();

  // 1. LEER
  const turnoActual = await buscarTurnoParaValidarCancelacion(id);
  if (!turnoActual) {
    return NextResponse.json({ error: "El turno no existe" }, { status: 404 });
  }

  // Verificar pertenencia (Seguridad)
  if (turnoActual.usuarioId !== sesion.usuarioId) {
    return NextResponse.json(
      { error: "El turno pertenece a otro cliente" },
      { status: 403 },
    );
  }

  // 2. REGLA DE NEGOCIO
  const errores = validarCancelacionTurno(turnoActual);
  if (errores.length > 0) {
    return NextResponse.json({ error: errores.join(". ") }, { status: 409 });
  }

  // 3. MUTAR
  const turnoCancelado = await marcarTurnoCancelado(id);
  return NextResponse.json(turnoCancelado);
}
