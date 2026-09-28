import { NextResponse } from "next/server";
import { requerirUsuario } from "@/lib/auth";
import {
  buscarPresupuestoParaValidar,
  marcarPresupuestoAprobado,
} from "@/lib/db/presupuestos";
import { validarAprobacionPresupuesto } from "@/lib/presupuestos";
import { responderError } from "@/lib/errores";

type ContextoRuta = { params: Promise<{ id: string }> };

export async function POST(_request: Request, contexto: ContextoRuta) {
  try {
    const { id } = await contexto.params;
    const sesion = await requerirUsuario("CLIENTE");

  // 1. LEER
    const presupuestoActual = await buscarPresupuestoParaValidar(id, sesion.id);

    if (!presupuestoActual) {
      return NextResponse.json(
        { error: "El presupuesto no existe" },
        { status: 404 },
      );
    }

  // 2. VALIDAR
    const errores = validarAprobacionPresupuesto(presupuestoActual);
    if (errores.length > 0) {
      return NextResponse.json({ error: errores.join(". ") }, { status: 409 });
    }

  // 3. MUTAR (Pasando el id de la orden para la transacción)
    const presupuestoAprobado = await marcarPresupuestoAprobado(
      id,
      presupuestoActual.ordenTrabajoId,
    );
    return NextResponse.json(presupuestoAprobado);
  } catch (error) {
    return responderError("POST /api/presupuestos/:id/aprobacion", error);
  }
}
