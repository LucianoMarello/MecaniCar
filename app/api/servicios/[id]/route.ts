import { NextResponse } from "next/server";
import {
  actualizarServicio,
  buscarServicioPorId,
  eliminarServicio,
} from "@/lib/db/servicios";
import { actualizarServicioSchema } from "@/lib/schemas/servicio";
import { responderError } from "@/lib/errores";
import { leerJson } from "@/lib/http";

type ContextoRuta = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, contexto: ContextoRuta) {
  try {
    const { id } = await contexto.params;

  // TODO (clase 6): verificar la sesión y el rol MECANICO.
    const servicio = await buscarServicioPorId(id);

    if (!servicio) {
      return NextResponse.json(
        { error: "El servicio no existe" },
        { status: 404 },
      );
    }

    return NextResponse.json(servicio);
  } catch (error) {
    return responderError("GET /api/servicios/:id", error);
  }
}

export async function PATCH(request: Request, contexto: ContextoRuta) {
  try {
    const { id } = await contexto.params;
    const lectura = await leerJson(request);
    if (!lectura.exito) {
      return NextResponse.json(
        { error: "El cuerpo de la solicitud no contiene JSON válido" },
        { status: 400 },
      );
    }

    const resultado = actualizarServicioSchema.safeParse(lectura.body);

    if (!resultado.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: resultado.error.flatten() },
        { status: 400 },
      );
    }

  // TODO (clase 6): verificar la sesión y el rol MECANICO.
    const servicio = await actualizarServicio(id, resultado.data);

    if (!servicio) {
      return NextResponse.json(
        { error: "El servicio no existe" },
        { status: 404 },
      );
    }

    return NextResponse.json(servicio);
  } catch (error) {
    return responderError("PATCH /api/servicios/:id", error);
  }
}

export async function DELETE(_request: Request, contexto: ContextoRuta) {
  try {
    const { id } = await contexto.params;

  // TODO (clase 6): verificar la sesión y el rol MECANICO.
    const resultado = await eliminarServicio(id);

    if (resultado === "NO_EXISTE") {
      return NextResponse.json(
        { error: "El servicio no existe" },
        { status: 404 },
      );
    }

    if (resultado === "EN_USO") {
      return NextResponse.json(
        { error: "El servicio está incluido en un presupuesto" },
        { status: 409 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return responderError("DELETE /api/servicios/:id", error);
  }
}
