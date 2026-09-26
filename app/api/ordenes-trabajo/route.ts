import { NextResponse } from "next/server";
import { requerirUsuario } from "@/lib/auth";
import { listarOrdenes } from "@/lib/db/ordenes-trabajo";
import { responderError } from "@/lib/errores";

export async function GET() {
  try {
    const sesion = await requerirUsuario();
    return NextResponse.json(
      await listarOrdenes(sesion.id, sesion.rol),
    );
  } catch (error) {
    return responderError("GET /api/ordenes-trabajo", error);
  }
}
