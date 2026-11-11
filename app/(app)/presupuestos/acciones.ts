"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth";
import { actualizarPresupuesto, crearPresupuesto, decidirPresupuesto } from "@/lib/casos/presupuestos";
import { esConflicto } from "@/lib/errores";
import { type EstadoFormulario } from "@/lib/formularios";
import { editarPresupuestoSchema, presupuestoSchema } from "@/lib/schemas/presupuesto";
import { idSchema } from "@/lib/schemas/http";
import { contarServicios, listarServicios } from "@/lib/db/servicios";
import { paginacionSchema } from "@/lib/schemas/http";

function idsDesde(formData: FormData) {
  return formData.getAll("serviciosIds").filter((v): v is string => typeof v === "string");
}

export async function cargarServiciosAction(paginaSolicitada: number) {
  const usuario = await obtenerUsuario();
  if (!usuario || usuario.rol === "CLIENTE") return { resultado: "NO_AUTORIZADO" } as const;
  const validacion = paginacionSchema.safeParse({ pagina: paginaSolicitada, limite: 100 });
  if (!validacion.success) return { resultado: "PAGINA_INVALIDA" } as const;
  const servicios = await listarServicios(validacion.data);
  const total = await contarServicios();
  return { resultado: "OK", servicios: servicios.map((s) => ({ id: s.id, nombre: s.nombre, precio: s.precioActual.toString() })), pagina: validacion.data.pagina, totalPaginas: Math.max(1, Math.ceil(total / 100)) } as const;
}

export async function crearPresupuestoAction(ordenTrabajoId: string, _previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  if (usuario.rol === "CLIENTE") return { mensaje: "Solo el taller puede crear presupuestos." };
  const entrada = presupuestoSchema.safeParse({ ordenTrabajoId, serviciosIds: idsDesde(formData) });
  if (!entrada.success) return { errores: entrada.error.flatten().fieldErrors };
  let resultado: Awaited<ReturnType<typeof crearPresupuesto>>;
  try {
    resultado = await crearPresupuesto(entrada.data.ordenTrabajoId, entrada.data.serviciosIds);
    if (resultado.resultado === "NO_EXISTE") return { mensaje: "La orden o algún servicio no existe." };
    if (resultado.resultado === "RECHAZADO") return { mensaje: resultado.motivos.join(". ") };
  } catch (error) {
    if (esConflicto(error)) return { mensaje: "La orden ya tiene un presupuesto o cambió de estado. Actualizá e intentá de nuevo." };
    throw error;
  }
  revalidatePath("/presupuestos");
  revalidatePath("/ordenes-trabajo");
  redirect(`/presupuestos/${resultado.presupuesto.id}${resultado.avisoEnviado ? "" : "?aviso=pendiente"}`);
}

export async function editarPresupuestoAction(id: string, _previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  if (usuario.rol === "CLIENTE") return { mensaje: "Solo el taller puede editar presupuestos." };
  const validId = idSchema.safeParse(id);
  const entrada = editarPresupuestoSchema.safeParse({ serviciosIds: idsDesde(formData) });
  if (!validId.success) return { mensaje: "El presupuesto no existe." };
  if (!entrada.success) return { errores: entrada.error.flatten().fieldErrors };
  try {
    const resultado = await actualizarPresupuesto(validId.data, entrada.data.serviciosIds);
    if (resultado.resultado === "NO_EXISTE") return { mensaje: "El presupuesto no existe." };
    revalidatePath("/presupuestos"); revalidatePath(`/presupuestos/${id}`); revalidatePath("/ordenes-trabajo");
    return resultado.avisoEnviado ? {} : { aviso: "Avisale al cliente por otro medio que el presupuesto fue actualizado y requiere aprobación." };
  } catch (error) {
    if (esConflicto(error)) return { mensaje: "No se pudo editar porque la orden cambió o está finalizada. Actualizá e intentá de nuevo." };
    throw error;
  }
}

export async function aprobarPresupuestoAction(id: string, _previo: EstadoFormulario): Promise<EstadoFormulario> {
  return decidirPresupuesto(id, "APROBAR");
}

export async function rechazarPresupuestoAction(id: string, _previo: EstadoFormulario): Promise<EstadoFormulario> {
  return decidirPresupuesto(id, "RECHAZAR");
}

async function decidirPresupuesto(id: string, decision: "APROBAR" | "RECHAZAR"): Promise<EstadoFormulario> {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  if (usuario.rol !== "CLIENTE") return { mensaje: "Solo el cliente propietario puede responder el presupuesto." };
  const validId = idSchema.safeParse(id);
  if (!validId.success) return { mensaje: "El presupuesto no existe." };
  try {
    const resultado = await decidirPresupuesto(validId.data, usuario.id, decision);
    if (resultado.resultado === "NO_EXISTE") return { mensaje: "El presupuesto no existe." };
    if (resultado.resultado === "RECHAZADO") return { mensaje: resultado.motivos.join(". ") };
    revalidatePath("/presupuestos"); revalidatePath(`/presupuestos/${id}`); revalidatePath("/ordenes-trabajo");
    return {};
  } catch (error) {
    if (esConflicto(error)) return { mensaje: "El presupuesto cambió mientras respondías. Actualizá la página." };
    throw error;
  }
}
