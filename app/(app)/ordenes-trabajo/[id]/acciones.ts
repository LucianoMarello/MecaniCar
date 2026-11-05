"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth";
import { buscarOrdenParaValidar, marcarOrdenFinalizada } from "@/lib/db/ordenes-trabajo";
import { leerTexto, type EstadoFormulario } from "@/lib/formularios";
import { idSchema } from "@/lib/schemas/http";
import { validarFinalizacionOrden } from "@/lib/ordenes";
import { enviarNotificacion } from "@/lib/servicios/notificaciones";
export async function finalizarOrden(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  if (usuario.rol === "CLIENTE") return { mensaje: "Solo el personal del taller puede finalizar órdenes." };
  const parsed = idSchema.safeParse(leerTexto(formData, "id"));
  if (!parsed.success) return { mensaje: "La orden indicada no es válida." };
  const orden = await buscarOrdenParaValidar(parsed.data);
  if (!orden) return { mensaje: "La orden no existe." };
  const errores = validarFinalizacionOrden(orden);
  if (errores.length) return { mensaje: errores.join(". ") };
  await marcarOrdenFinalizada(parsed.data);
  const avisoEnviado = await enviarNotificacion({ destinatario: orden.turno.usuario.email, asunto: "Tu vehículo está listo - MecaniCar", mensaje: `La orden ${parsed.data} fue finalizada. Tu vehículo está listo para retirar.` });
  revalidatePath("/ordenes-trabajo");
  revalidatePath(`/ordenes-trabajo/${parsed.data}`);
  redirect(`/ordenes-trabajo/${parsed.data}${avisoEnviado ? "" : "?aviso=pendiente"}`);
}
