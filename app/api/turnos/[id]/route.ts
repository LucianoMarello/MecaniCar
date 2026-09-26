import { NextResponse } from "next/server";
import { requerirUsuario } from "@/lib/auth";
import { buscarTurno } from "@/lib/db/turnos";
import { responderError } from "@/lib/errores";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Contexto) {
  try {
    const { id } = await params;
    const sesion = await requerirUsuario();
    const resultado = await buscarTurno(id, sesion.id, sesion.rol);
    if (resultado.resultado === "NO_EXISTE") {
      return NextResponse.json({ error: "El turno no existe" }, { status: 404 });
    }
    return NextResponse.json(resultado.turno);
  } catch (error) {
    return responderError("GET /api/turnos/:id", error);
  }
}
