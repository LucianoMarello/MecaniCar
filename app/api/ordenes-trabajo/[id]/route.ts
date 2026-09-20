import { NextResponse } from "next/server";
import { obtenerSesionDemo } from "@/lib/auth-demo";
import { buscarOrden } from "@/lib/db/ordenes-trabajo";
type Contexto = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Contexto) {
  const { id } = await params; const sesion = obtenerSesionDemo();
  const resultado = await buscarOrden(id, sesion.usuarioId, sesion.rol);
  if (resultado.resultado === "NO_EXISTE") return NextResponse.json({ error: "La orden no existe" }, { status: 404 });
  if (resultado.resultado === "PROHIBIDO") return NextResponse.json({ error: "No puede acceder a esta orden" }, { status: 403 });
  return NextResponse.json(resultado.orden);
}
