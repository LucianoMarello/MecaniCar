import { NextResponse } from "next/server";
import { requerirUsuario } from "@/lib/auth";
import {
  buscarOrdenYServiciosParaPresupuesto,
  insertarPresupuesto,
  listarPresupuestos,
} from "@/lib/db/presupuestos";
import { validarCreacionPresupuesto } from "@/lib/presupuestos";
import { presupuestoSchema } from "@/lib/schemas/presupuesto";
import { responderError } from "@/lib/errores";
import { leerJson } from "@/lib/http";

export async function GET() {
  try {
    const sesion = await requerirUsuario();
    return NextResponse.json(
      await listarPresupuestos(sesion.id, sesion.rol),
    );
  } catch (error) {
    return responderError("GET /api/presupuestos", error);
  }
}

export async function POST(request: Request) {
  try {
    const lectura = await leerJson(request);
    if (!lectura.exito) {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const validacion = presupuestoSchema.safeParse(lectura.body);
    if (!validacion.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: validacion.error.flatten() },
        { status: 400 },
      );
    }

    await requerirUsuario("MECANICO");
    const datos = validacion.data;

  // 1. LEER (sin tomar decisiones lógicas)
    const { orden, servicios, idsUnicos } =
      await buscarOrdenYServiciosParaPresupuesto(
        datos.ordenTrabajoId,
        datos.serviciosIds,
      );

    if (!orden || servicios.length !== idsUnicos.length) {
      return NextResponse.json(
        { error: "La orden o alguno de los servicios no existe" },
        { status: 404 },
      );
    }

  // 2. VALIDAR NEGOCIO (función pura)
    const errores = validarCreacionPresupuesto(orden);
    if (errores.length > 0) {
      return NextResponse.json({ error: errores.join(". ") }, { status: 409 });
    }

  // 3. MUTAR LA BASE
    const presupuesto = await insertarPresupuesto(
      datos.ordenTrabajoId,
      servicios,
    );
    return NextResponse.json(presupuesto, { status: 201 });
  } catch (error) {
    return responderError("POST /api/presupuestos", error);
  }
}
