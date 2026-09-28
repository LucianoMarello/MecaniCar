import { NextResponse } from "next/server";
import { requerirUsuario } from "@/lib/auth";
import { buscarPresupuesto } from "@/lib/db/presupuestos";
import { responderError } from "@/lib/errores";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Contexto) {
  try {
    const { id } = await params;
    const sesion = await requerirUsuario();
    const resultado = await buscarPresupuesto(id, sesion.id, sesion.rol);
    if (resultado.resultado === "NO_EXISTE") {
      return NextResponse.json(
        { error: "El presupuesto no existe" },
        { status: 404 },
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
