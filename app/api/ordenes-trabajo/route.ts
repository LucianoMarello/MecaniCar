import { NextResponse } from "next/server";
import { obtenerSesionDemo } from "@/lib/auth-demo";
import { listarOrdenes } from "@/lib/db/ordenes-trabajo";
export async function GET() {
  const sesion = obtenerSesionDemo();
  return NextResponse.json(await listarOrdenes(sesion.usuarioId, sesion.rol));
}
