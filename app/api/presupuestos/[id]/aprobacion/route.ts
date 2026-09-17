import { NextResponse } from "next/server";
import { aprobarPresupuesto } from "@/lib/db/presupuestos";

type ContextoRuta = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, contexto: ContextoRuta) {
  const { id } = await contexto.params;

  // TODO (clase 6): obtener el usuario y su rol desde la sesión.
  const usuarioId = "usuario-cliente-demo";

  // TODO (clase 5): centralizar las reglas de transición de estados.
  const resultado = await aprobarPresupuesto(id, usuarioId);

  if (resultado.resultado === "NO_EXISTE") {
    return NextResponse.json(
      { error: "El presupuesto no existe" },
      { status: 404 },
    );
  }

  if (resultado.resultado === "PROHIBIDO") {
    return NextResponse.json(
      { error: "El presupuesto pertenece a otro cliente" },
      { status: 403 },
    );
  }

  if (resultado.resultado === "ESTADO_INVALIDO") {
    return NextResponse.json(
      { error: "Solamente puede aprobarse un presupuesto pendiente" },
      { status: 409 },
    );
  }

  return NextResponse.json(resultado.presupuesto);
}
