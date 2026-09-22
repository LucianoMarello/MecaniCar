import { NextResponse } from "next/server";
import { obtenerSesionDemo } from "@/lib/auth-demo";
import { crearTurno, listarTurnos } from "@/lib/db/turnos";
import { responderError } from "@/lib/errores";
import { leerJson } from "@/lib/http";
import { turnoSchema } from "@/lib/schemas/turno";

export async function GET() {
  try {
    const sesion = obtenerSesionDemo();
    return NextResponse.json(
      await listarTurnos(sesion.usuarioId, sesion.rol),
    );
  } catch (error) {
    return responderError("GET /api/turnos", error);
  }
}

export async function POST(request: Request) {
  try {
    const sesion = obtenerSesionDemo();
    const lectura = await leerJson(request);
    if (!lectura.exito) {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }
    const validacion = turnoSchema.safeParse(lectura.body);
    if (!validacion.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: validacion.error.flatten() },
        { status: 400 },
      );
    }
    const resultado = await crearTurno(validacion.data, sesion.usuarioId);
    if (resultado.resultado === "VEHICULO_NO_EXISTE") {
      return NextResponse.json(
        { error: "El vehículo no existe" },
        { status: 404 },
      );
    }
    if (resultado.resultado === "PROHIBIDO") {
      return NextResponse.json(
        { error: "El vehículo pertenece a otro cliente" },
        { status: 403 },
      );
    }
    return NextResponse.json(resultado.turno, { status: 201 });
  } catch (error) {
    return responderError("POST /api/turnos", error);
  }
}
