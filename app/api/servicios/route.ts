import { NextResponse } from "next/server";
import { crearServicio, listarServicios } from "@/lib/db/servicios";
import { servicioSchema } from "@/lib/schemas/servicio";

export async function GET() {
  // TODO (clase 6): verificar la sesión y el rol MECANICO.
  const servicios = await listarServicios();
  return NextResponse.json(servicios);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud no contiene JSON válido" },
      { status: 400 },
    );
  }

  const resultado = servicioSchema.safeParse(body);

  if (!resultado.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: resultado.error.flatten() },
      { status: 400 },
    );
  }

  // TODO (clase 6): verificar la sesión y el rol MECANICO.
  const servicio = await crearServicio(resultado.data);
  return NextResponse.json(servicio, { status: 201 });
}
