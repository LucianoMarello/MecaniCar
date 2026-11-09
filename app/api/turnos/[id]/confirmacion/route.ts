import { idSchema } from "@/lib/schemas/http";
import { NextResponse } from "next/server";
import { confirmarTurno } from "@/lib/casos/turnos";
import { responderError } from "@/lib/errores";
import { requerirUsuario } from "@/lib/auth";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Contexto) {
  try {
    // 1. Sesión y rol
    await requerirUsuario("MECANICO");
    // 2. Entrada
    const id = idSchema.parse((await params).id);

    // 3 y 4. Regla, escritura y aviso al cliente
    const resultado = await confirmarTurno(id);

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
    return NextResponse.json({
      ...resultado.turno,
      avisoEnviado: resultado.avisoEnviado,
    });
  } catch (error) {
    return responderError("POST /api/turnos/:id/confirmacion", error);
  }
}
