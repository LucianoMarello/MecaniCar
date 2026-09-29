import { NextResponse } from "next/server";
import {
  buscarEmailDeOrden,
  buscarOrdenParaValidar,
  marcarOrdenFinalizada,
} from "@/lib/db/ordenes-trabajo";
import { validarFinalizacionOrden } from "@/lib/ordenes";
import { responderError } from "@/lib/errores";
import { requerirUsuario } from "@/lib/auth";
import { enviarNotificacion } from "@/lib/servicios/notificaciones";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Contexto) {
  try {
    const { id } = await params;
    await requerirUsuario("MECANICO");

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
    const contacto = await buscarEmailDeOrden(id);

if (contacto) {
  await enviarNotificacion({
    destinatario: contacto.turno.usuario.email,
    asunto: "Tu vehículo está listo - MecaniCar",
    mensaje: `La orden ${id} fue finalizada. Tu vehículo está listo para retirar.`,
  });
}
    return NextResponse.json(ordenFinalizada);
  } catch (error) {
    return responderError("POST /api/ordenes-trabajo/:id/finalizacion", error);
  }
}
