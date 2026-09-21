import { NextResponse } from "next/server";
import {
  buscarTurnoParaIngreso,
  insertarOrdenDesdeTurno,
} from "@/lib/db/ordenes-trabajo";
import { validarIngresoTaller } from "@/lib/turnos";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Contexto) {
  const { id } = await params;
  // TODO (clase 6): exigir rol MECANICO.

  // 1. LEER
  const turnoActual = await buscarTurnoParaIngreso(id);
  if (!turnoActual) {
    return NextResponse.json({ error: "El turno no existe" }, { status: 404 });
  }

  // 2. REGLA DE NEGOCIO
  const errores = validarIngresoTaller(turnoActual);
  if (errores.length > 0) {
    return NextResponse.json({ error: errores.join(". ") }, { status: 409 });
  }

  // 3. MUTAR
  const ordenCreada = await insertarOrdenDesdeTurno(id, turnoActual.vehiculoId);
  return NextResponse.json(ordenCreada, { status: 201 });
}
