import { NextResponse } from "next/server";
import { obtenerSesionDemo } from "@/lib/auth-demo";
import { rechazarPresupuesto } from "@/lib/db/presupuestos";
type Contexto = { params: Promise<{ id: string }> };
export async function POST(_request: Request, { params }: Contexto) {
  const { id } = await params; const sesion = obtenerSesionDemo();
  const resultado = await rechazarPresupuesto(id, sesion.usuarioId);
  if (resultado.resultado === "NO_EXISTE") return NextResponse.json({ error: "El presupuesto no existe" }, { status: 404 });
  if (resultado.resultado === "PROHIBIDO") return NextResponse.json({ error: "El presupuesto pertenece a otro cliente" }, { status: 403 });
  if (resultado.resultado === "ESTADO_INVALIDO") return NextResponse.json({ error: "Solo puede rechazarse un presupuesto pendiente" }, { status: 409 });
  return NextResponse.json(resultado.presupuesto);
}
