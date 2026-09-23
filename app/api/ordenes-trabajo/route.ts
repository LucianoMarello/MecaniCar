import { NextResponse } from "next/server";
import { obtenerSesionDemo } from "@/lib/auth-demo";
import { listarOrdenes } from "@/lib/db/ordenes-trabajo";
import { responderError } from "@/lib/errores";

export async function GET() {
  try {
    const sesion = obtenerSesionDemo();
    return NextResponse.json(
      await listarOrdenes(sesion.usuarioId, sesion.rol),
    );
  } catch (error) {
    return responderError("GET /api/ordenes-trabajo", error);
  }
}
