import { idSchema } from "@/lib/schemas/http";
import { NextResponse } from "next/server";
import { requerirUsuario } from "@/lib/auth";
import { buscarOrden } from "@/lib/db/ordenes-trabajo";
import { responderError } from "@/lib/errores";
type Contexto = {
  params: Promise<{
    id: string;
  }>;
};
export async function GET(_request: Request, { params }: Contexto) {
  try {
    const sesion = await requerirUsuario();
    const id = idSchema.parse((await params).id);
    const resultado = await buscarOrden(id, sesion.id, sesion.rol);
    if (resultado.resultado === "NO_EXISTE") {
      return NextResponse.json(
        { error: "La orden no existe" },
        { status: 404 },
      );
    }
    return NextResponse.json(resultado.orden);
  } catch (error) {
    return responderError("GET /api/ordenes-trabajo/:id", error);
  }
}
