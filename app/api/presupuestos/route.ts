import { NextResponse } from "next/server";
import { obtenerSesionDemo } from "@/lib/auth-demo";
import {
  buscarOrdenYServiciosParaPresupuesto,
  insertarPresupuesto,
  listarPresupuestos,
} from "@/lib/db/presupuestos";
import { validarCreacionPresupuesto } from "@/lib/presupuestos";
import { presupuestoSchema } from "@/lib/schemas/presupuesto";

export async function GET() {
  const sesion = obtenerSesionDemo();
  return NextResponse.json(
    await listarPresupuestos(sesion.usuarioId, sesion.rol),
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const validacion = presupuestoSchema.safeParse(body);
  if (!validacion.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: validacion.error.flatten() },
      { status: 400 },
    );
  }

  // TODO (clase 6): exigir rol MECANICO.
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
}
