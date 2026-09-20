import { NextResponse } from "next/server";
import { finalizarOrden } from "@/lib/db/ordenes-trabajo";
type Contexto = { params: Promise<{ id: string }> };
export async function POST(_request: Request, { params }: Contexto) {
  const { id } = await params; // TODO (clase 6): exigir rol MECANICO.
  const resultado = await finalizarOrden(id);
  if (resultado.resultado === "NO_EXISTE") return NextResponse.json({ error: "La orden no existe" }, { status: 404 });
  if (resultado.resultado === "ESTADO_INVALIDO") return NextResponse.json({ error: "La orden no está en reparación con un presupuesto aprobado" }, { status: 409 });
  return NextResponse.json(resultado.orden);
}
