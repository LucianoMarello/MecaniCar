import { NextResponse } from "next/server";
import { obtenerSesionDemo } from "@/lib/auth-demo";
import { buscarPresupuesto } from "@/lib/db/presupuestos";
import { responderError } from "@/lib/errores";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Contexto) {
  try {
    const { id } = await params;
    const sesion = obtenerSesionDemo();
    const resultado = await buscarPresupuesto(id, sesion.usuarioId, sesion.rol);
    if (resultado.resultado === "NO_EXISTE") {
      return NextResponse.json(
        { error: "El presupuesto no existe" },
        { status: 404 },
      );
    }
    if (resultado.resultado === "PROHIBIDO") {
      return NextResponse.json(
        { error: "No puede acceder a este presupuesto" },
        { status: 403 },
      );
    }
    const total = resultado.presupuesto.detalles.reduce(
      (suma, detalle) => suma + Number(detalle.precioAplicado),
      0,
    );
    return NextResponse.json({ ...resultado.presupuesto, total });
  } catch (error) {
    return responderError("GET /api/presupuestos/:id", error);
  }
}
