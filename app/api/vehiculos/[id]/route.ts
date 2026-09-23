import { NextResponse } from "next/server";
import { obtenerSesionDemo } from "@/lib/auth-demo";
import {
  actualizarVehiculo,
  buscarVehiculo,
  eliminarVehiculo,
} from "@/lib/db/vehiculos";
import { responderError } from "@/lib/errores";
import { leerJson } from "@/lib/http";
import { actualizarVehiculoSchema } from "@/lib/schemas/vehiculo";

type Contexto = { params: Promise<{ id: string }> };

function errorAcceso(resultado: "NO_EXISTE" | "PROHIBIDO") {
  return NextResponse.json(
    {
      error:
        resultado === "NO_EXISTE"
          ? "El vehículo no existe"
          : "No puede acceder a este vehículo",
    },
    { status: resultado === "NO_EXISTE" ? 404 : 403 },
  );
}

export async function GET(_request: Request, { params }: Contexto) {
  try {
    const { id } = await params;
    const sesion = obtenerSesionDemo();
    const resultado = await buscarVehiculo(id, sesion.usuarioId, sesion.rol);
    if (resultado.resultado !== "OK") {
      return errorAcceso(resultado.resultado);
    }
    return NextResponse.json(resultado.vehiculo);
  } catch (error) {
    return responderError("GET /api/vehiculos/:id", error);
  }
}

export async function PATCH(request: Request, { params }: Contexto) {
  try {
    const { id } = await params;
    const sesion = obtenerSesionDemo();
    const lectura = await leerJson(request);
    if (!lectura.exito) {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }
    const validacion = actualizarVehiculoSchema.safeParse(lectura.body);
    if (!validacion.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: validacion.error.flatten() },
        { status: 400 },
      );
    }
    const resultado = await actualizarVehiculo(
      id,
      validacion.data,
      sesion.usuarioId,
      sesion.rol,
    );
    if (
      resultado.resultado === "NO_EXISTE" ||
      resultado.resultado === "PROHIBIDO"
    ) {
      return errorAcceso(resultado.resultado);
    }
    if (resultado.resultado === "PATENTE_DUPLICADA") {
      return NextResponse.json(
        { error: "La patente ya está registrada" },
        { status: 409 },
      );
    }
    return NextResponse.json(resultado.vehiculo);
  } catch (error) {
    return responderError("PATCH /api/vehiculos/:id", error);
  }
}

export async function DELETE(_request: Request, { params }: Contexto) {
  try {
    const { id } = await params;
    const sesion = obtenerSesionDemo();
    const resultado = await eliminarVehiculo(
      id,
      sesion.usuarioId,
      sesion.rol,
    );
    if (
      resultado.resultado === "NO_EXISTE" ||
      resultado.resultado === "PROHIBIDO"
    ) {
      return errorAcceso(resultado.resultado);
    }
    if (resultado.resultado === "EN_USO") {
      return NextResponse.json(
        { error: "El vehículo tiene turnos u órdenes asociados" },
        { status: 409 },
      );
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return responderError("DELETE /api/vehiculos/:id", error);
  }
}
