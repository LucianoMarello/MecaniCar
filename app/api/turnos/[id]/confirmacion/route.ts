import { NextResponse } from "next/server";
import { confirmarTurno } from "@/lib/db/turnos";
type Contexto = { params: Promise<{ id: string }> };
export async function POST(_request: Request, { params }: Contexto) {
  const { id } = await params; // TODO (clase 6): exigir rol MECANICO.
  const resultado = await confirmarTurno(id);
  if (resultado.resultado === "NO_EXISTE") return NextResponse.json({ error: "El turno no existe" }, { status: 404 });
  if (resultado.resultado === "ESTADO_INVALIDO") return NextResponse.json({ error: "Solo puede confirmarse un turno pendiente" }, { status: 409 });
  return NextResponse.json(resultado.turno);
}
