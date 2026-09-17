import { NextResponse } from "next/server";
import { listarTurnosDeCliente } from "@/lib/db/turnos";

export async function GET() {
  // TODO (clase 6): obtener el usuario y su rol desde la sesión.
  const usuarioId = "usuario-cliente-demo";

  const turnos = await listarTurnosDeCliente(usuarioId);
  return NextResponse.json(turnos);
}
