import { NextResponse } from "next/server";
import { obtenerSesionDemo } from "@/lib/auth-demo";
import { buscarTurno } from "@/lib/db/turnos";
import { responderError } from "@/lib/errores";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Contexto) {
  try {
    const { id } = await params;
    const sesion = obtenerSesionDemo();
    const resultado = await buscarTurno(id, sesion.usuarioId, sesion.rol);
    if (resultado.resultado === "NO_EXISTE") {
      return NextResponse.json({ error: "El turno no existe" }, { status: 404 });
    }
    if (resultado.resultado === "PROHIBIDO") {
      return NextResponse.json(
        { error: "No puede acceder a este turno" },
        { status: 403 },
      );
    }
    return NextResponse.json(resultado.turno);
  } catch (error) {
    return responderError("GET /api/turnos/:id", error);
  }
}
