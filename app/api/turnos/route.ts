import { NextResponse } from "next/server";
import { obtenerSesionDemo } from "@/lib/auth-demo";
import { crearTurno, listarTurnos } from "@/lib/db/turnos";
import { turnoSchema } from "@/lib/schemas/turno";

export async function GET() {
  const sesion = obtenerSesionDemo();
  return NextResponse.json(await listarTurnos(sesion.usuarioId, sesion.rol));
}

export async function POST(request: Request) {
  const sesion = obtenerSesionDemo(); let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  const validacion = turnoSchema.safeParse(body);
  if (!validacion.success) return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.flatten() }, { status: 400 });
  const resultado = await crearTurno(validacion.data, sesion.usuarioId);
  if (resultado.resultado === "VEHICULO_NO_EXISTE") return NextResponse.json({ error: "El vehículo no existe" }, { status: 404 });
  if (resultado.resultado === "PROHIBIDO") return NextResponse.json({ error: "El vehículo pertenece a otro cliente" }, { status: 403 });
  return NextResponse.json(resultado.turno, { status: 201 });
}
