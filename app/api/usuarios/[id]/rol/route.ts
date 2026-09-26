import { NextResponse } from "next/server";
import { requerirUsuario } from "@/lib/auth";
import { cambiarRolUsuario } from "@/lib/db/usuarios";
import { responderError } from "@/lib/errores";
import { leerJson } from "@/lib/http";
import { cambiarRolSchema } from "@/lib/schemas/autenticacion";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requerirUsuario("ADMIN"); const lectura = await leerJson(request);
    if (!lectura.exito) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    const validacion = cambiarRolSchema.safeParse(lectura.body);
    if (!validacion.success) return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.flatten() }, { status: 400 });
    const cambio = await cambiarRolUsuario({ usuarioId: (await params).id, administradorId: admin.id, rol: validacion.data.rol });
    if (cambio.resultado === "NO_EXISTE") return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    if (cambio.resultado === "MISMO_USUARIO") return NextResponse.json({ error: "El administrador no puede modificar su propio rol" }, { status: 409 });
    return NextResponse.json(cambio.usuario);
  } catch (error) { return responderError("PATCH /api/usuarios/:id/rol", error); }
}
