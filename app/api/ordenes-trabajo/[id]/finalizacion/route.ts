import { NextResponse } from "next/server";
import {
  buscarOrdenParaValidar,
  marcarOrdenFinalizada,
} from "@/lib/db/ordenes-trabajo";
import { validarFinalizacionOrden } from "@/lib/ordenes";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Contexto) {
  const { id } = await params;
  // TODO (clase 6): exigir rol MECANICO.

  // 1. LEER (sin decidir)
  const ordenActual = await buscarOrdenParaValidar(id);
  if (!ordenActual) {
    return NextResponse.json({ error: "La orden no existe" }, { status: 404 });
  }

  // 2. REGLAS DE NEGOCIO (función pura)
  const errores = validarFinalizacionOrden(ordenActual);
  if (errores.length > 0) {
    return NextResponse.json({ error: errores.join(". ") }, { status: 409 });
  }

  // 3. MUTAR LA BASE (escribir)
  const ordenFinalizada = await marcarOrdenFinalizada(id);
  return NextResponse.json(ordenFinalizada);
}
