import { idSchema } from "@/lib/schemas/http";
import { NextResponse } from "next/server";
import { requerirUsuario } from "@/lib/auth";
import { cancelarTurno } from "@/lib/casos/turnos";
import { responderError } from "@/lib/errores";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Contexto) {
  try {
    // 1. Sesión y rol
    const sesion = await requerirUsuario("CLIENTE");
    // 2. Entrada
    const id = idSchema.parse((await params).id);

    // 3 y 4. Acceso (solo sus turnos), regla y escritura
    const resultado = await cancelarTurno(id, sesion.id);

    // 5. Respuesta
    if (resultado.resultado === "NO_EXISTE") {
      return NextResponse.json({ error: "El turno no existe" }, { status: 404 });
    }
    if (resultado.resultado === "RECHAZADO") {
      return NextResponse.json(
        { error: resultado.motivos.join(". ") },
        { status: 409 },
      );
    }
    return NextResponse.json(resultado.turno);
  } catch (error) {
    return responderError("POST /api/turnos/:id/cancelacion", error);
  }
}
