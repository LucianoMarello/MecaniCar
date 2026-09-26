import { NextResponse } from "next/server";
import { requerirUsuario } from "@/lib/auth";
import { crearVehiculo, listarVehiculos } from "@/lib/db/vehiculos";
import { responderError } from "@/lib/errores";
import { leerJson } from "@/lib/http";
import { vehiculoSchema } from "@/lib/schemas/vehiculo";

export async function GET() {
  try {
    const sesion = await requerirUsuario();
    return NextResponse.json(
      await listarVehiculos(sesion.id, sesion.rol),
    );
  } catch (error) {
    return responderError("GET /api/vehiculos", error);
  }
}

export async function POST(request: Request) {
  try {
    const lectura = await leerJson(request);
    if (!lectura.exito) {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }
    const validacion = vehiculoSchema.safeParse(lectura.body);
    if (!validacion.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: validacion.error.flatten() },
        { status: 400 },
      );
    }
    const sesion = await requerirUsuario("CLIENTE");
    const resultado = await crearVehiculo(validacion.data, sesion.id);
    if (resultado.resultado === "PATENTE_DUPLICADA") {
      return NextResponse.json(
        { error: "La patente ya está registrada" },
        { status: 409 },
      );
    }
    return NextResponse.json(resultado.vehiculo, { status: 201 });
  } catch (error) {
    return responderError("POST /api/vehiculos", error);
  }
}
