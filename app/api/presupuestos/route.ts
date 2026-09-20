import { NextResponse } from "next/server";
import { obtenerSesionDemo } from "@/lib/auth-demo";
import { crearPresupuesto, listarPresupuestos } from "@/lib/db/presupuestos";
import { presupuestoSchema } from "@/lib/schemas/presupuesto";

export async function GET() {
  const sesion = obtenerSesionDemo();
  return NextResponse.json(await listarPresupuestos(sesion.usuarioId, sesion.rol));
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  const validacion = presupuestoSchema.safeParse(body);
  if (!validacion.success) return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.flatten() }, { status: 400 });
  // TODO (clase 6): exigir rol MECANICO.
  const resultado = await crearPresupuesto(validacion.data);
  if (resultado.resultado === "ORDEN_NO_EXISTE" || resultado.resultado === "SERVICIO_NO_EXISTE") return NextResponse.json({ error: "La orden o alguno de los servicios no existe" }, { status: 404 });
  if (resultado.resultado === "ORDEN_FINALIZADA") return NextResponse.json({ error: "No se puede presupuestar una orden finalizada" }, { status: 409 });
  return NextResponse.json(resultado.presupuesto, { status: 201 });
}
