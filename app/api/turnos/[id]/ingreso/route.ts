import { NextResponse } from "next/server";
import { registrarIngreso } from "@/lib/db/ordenes-trabajo";
type Contexto = { params: Promise<{ id: string }> };
export async function POST(_request: Request, { params }: Contexto) {
  const { id } = await params; // TODO (clase 6): exigir rol MECANICO.
  const resultado = await registrarIngreso(id);
  if (resultado.resultado === "NO_EXISTE") return NextResponse.json({ error: "El turno no existe" }, { status: 404 });
  if (resultado.resultado === "ESTADO_INVALIDO") return NextResponse.json({ error: "El turno no está confirmado o ya tiene una orden" }, { status: 409 });
  return NextResponse.json(resultado.orden, { status: 201 });
}
