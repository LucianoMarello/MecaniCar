import { enviarNotificacion } from "@/lib/servicios/notificaciones";
import { idSchema } from "@/lib/schemas/http";
import {
  editarPresupuesto,
  buscarDestinatarioPresupuesto,
} from "@/lib/db/presupuestos";
import { leerJson } from "@/lib/http";
import { editarPresupuestoSchema } from "@/lib/schemas/presupuesto";
import { NextResponse } from "next/server";
import { requerirUsuario } from "@/lib/auth";
import { buscarPresupuesto } from "@/lib/db/presupuestos";
import { responderError } from "@/lib/errores";
type Contexto = {
  params: Promise<{
    id: string;
  }>;
};
export async function GET(_request: Request, { params }: Contexto) {
  try {
    const sesion = await requerirUsuario();
    const id = idSchema.parse((await params).id);
    const resultado = await buscarPresupuesto(id, sesion.id, sesion.rol);
    if (resultado.resultado === "NO_EXISTE") {
      return NextResponse.json(
        { error: "El presupuesto no existe" },
        { status: 404 },
      );
    }
    return NextResponse.json(resultado.presupuesto);
  } catch (error) {
    return responderError("GET /api/presupuestos/:id", error);
  }
}
export async function PATCH(
  request: Request,
  contexto: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    await requerirUsuario("MECANICO");
    const id = idSchema.parse((await contexto.params).id);
    const lectura = await leerJson(request);
    if (!lectura.exito)
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    const datos = editarPresupuestoSchema.parse(lectura.body);
    const presupuesto = await editarPresupuesto(id, datos.serviciosIds);
    if (!presupuesto)
      return NextResponse.json(
        { error: "El presupuesto no existe" },
        { status: 404 },
      );
    // El correo es accesorio: una falla no revierte la edición ya confirmada.
    try {
      const destinatario = await buscarDestinatarioPresupuesto(id);
      if (destinatario)
        await enviarNotificacion({
          destinatario,
          asunto: "Presupuesto actualizado - MecaniCar",
          mensaje: `El presupuesto ${id} fue actualizado. El total es $${presupuesto.total}. Revisalo y aprobalo nuevamente antes de continuar la reparación.`,
        });
    } catch {
      console.error(
        "notificaciones: no se pudo consultar el destinatario del presupuesto editado",
      );
    }
    return NextResponse.json(presupuesto);
  } catch (error) {
    return responderError("PATCH /api/presupuestos/:id", error);
  }
}
