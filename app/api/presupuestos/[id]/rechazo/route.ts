import { NextResponse } from "next/server";
import { requerirUsuario } from "@/lib/auth";
import {
  buscarPresupuestoParaValidar,
  marcarPresupuestoRechazado,
} from "@/lib/db/presupuestos";
import { validarRechazoPresupuesto } from "@/lib/presupuestos";
import { responderError } from "@/lib/errores";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Contexto) {
  try {
    const { id } = await params;
    const sesion = await requerirUsuario("CLIENTE");

  // 1. LEER
    const presupuestoActual = await buscarPresupuestoParaValidar(id, sesion.id);
    if (!presupuestoActual) {
      return NextResponse.json(
        { error: "El presupuesto no existe" },
        { status: 404 },
      );
    }

  // 2. VALIDAR NEGOCIO
    const errores = validarRechazoPresupuesto(presupuestoActual);
    if (errores.length > 0) {
      return NextResponse.json({ error: errores.join(". ") }, { status: 409 });
    }

  // 3. MUTAR
    const presupuestoRechazado = await marcarPresupuestoRechazado(id);
    return NextResponse.json(presupuestoRechazado);
  } catch (error) {
    return responderError("POST /api/presupuestos/:id/rechazo", error);
  }
}
