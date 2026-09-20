import { NextResponse } from "next/server";
import { obtenerSesionDemo } from "@/lib/auth-demo";
import { crearVehiculo, listarVehiculos } from "@/lib/db/vehiculos";
import { vehiculoSchema } from "@/lib/schemas/vehiculo";

export async function GET() {
  const sesion = obtenerSesionDemo();
  return NextResponse.json(await listarVehiculos(sesion.usuarioId, sesion.rol));
}

export async function POST(request: Request) {
  const sesion = obtenerSesionDemo();
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  const validacion = vehiculoSchema.safeParse(body);
  if (!validacion.success) return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.flatten() }, { status: 400 });
  // TODO (clase 6): exigir rol CLIENTE desde la sesión real.
  const resultado = await crearVehiculo(validacion.data, sesion.usuarioId);
  if (resultado.resultado === "PATENTE_DUPLICADA") return NextResponse.json({ error: "La patente ya está registrada" }, { status: 409 });
  return NextResponse.json(resultado.vehiculo, { status: 201 });
}
