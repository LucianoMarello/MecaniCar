import { NextResponse } from "next/server";
import { crearServicio, listarServicios } from "@/lib/db/servicios";
import { servicioSchema } from "@/lib/schemas/servicio";
import { responderError } from "@/lib/errores";
import { leerJson } from "@/lib/http";

export async function GET() {
  try {
    // TODO (clase 6): verificar la sesión y el rol MECANICO.
    const servicios = await listarServicios();
    return NextResponse.json(servicios);
  } catch (error) {
    return responderError("GET /api/servicios", error);
  }
}

export async function POST(request: Request) {
  try {
    const lectura = await leerJson(request);
    if (!lectura.exito) {
      return NextResponse.json(
        { error: "El cuerpo de la solicitud no contiene JSON válido" },
        { status: 400 },
      );
    }

    const resultado = servicioSchema.safeParse(lectura.body);

    if (!resultado.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: resultado.error.flatten() },
        { status: 400 },
      );
    }

    // TODO (clase 6): verificar la sesión y el rol MECANICO.
    const servicio = await crearServicio(resultado.data);
    return NextResponse.json(servicio, { status: 201 });
  } catch (error) {
    return responderError("POST /api/servicios", error);
  }
}
