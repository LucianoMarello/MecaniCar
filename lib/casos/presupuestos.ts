import {
  buscarDestinatarioPresupuesto,
  buscarOrdenYServiciosParaPresupuesto,
  buscarPresupuestoParaValidar,
  editarPresupuesto,
  insertarPresupuesto,
  marcarPresupuestoAprobado,
  marcarPresupuestoRechazado,
} from "@/lib/db/presupuestos";
import { validarAprobacionPresupuesto, validarCreacionPresupuesto, validarRechazoPresupuesto } from "@/lib/presupuestos";
import { enviarNotificacion } from "@/lib/servicios/notificaciones";

export async function crearPresupuesto(ordenId: string, servicioIds: string[]) {
  const { orden, servicios, idsUnicos } = await buscarOrdenYServiciosParaPresupuesto(ordenId, servicioIds);
  if (!orden || servicios.length !== idsUnicos.length) return { resultado: "NO_EXISTE" } as const;
  const motivos = validarCreacionPresupuesto(orden);
  if (motivos.length) return { resultado: "RECHAZADO", motivos } as const;
  const presupuesto = await insertarPresupuesto(ordenId, servicios);
  const avisoEnviado = await enviarNotificacion({ destinatario: orden.turno.usuario.email, asunto: "Nuevo presupuesto disponible - MecaniCar", mensaje: `Ya está disponible el presupuesto ${presupuesto.id} para tu vehículo.` });
  return { resultado: "CREADO", presupuesto, avisoEnviado } as const;
}

export async function actualizarPresupuesto(id: string, servicioIds: string[]) {
  const presupuesto = await editarPresupuesto(id, servicioIds);
  if (!presupuesto) return { resultado: "NO_EXISTE" } as const;
  let avisoEnviado = false;
  try {
    const destinatario = await buscarDestinatarioPresupuesto(id);
    if (destinatario) {
      avisoEnviado = await enviarNotificacion({
        destinatario,
        asunto: "Presupuesto actualizado - MecaniCar",
        mensaje: `El presupuesto ${id} fue actualizado. El total es $${presupuesto.total}. Revisalo y aprobalo nuevamente antes de continuar la reparación.`,
      });
    } else {
      console.error("notificaciones: el presupuesto editado no tiene destinatario");
    }
  } catch {
    console.error("notificaciones: no se pudo consultar el destinatario del presupuesto editado");
  }
  return { resultado: "ACTUALIZADO", presupuesto, avisoEnviado } as const;
}

export async function decidirPresupuesto(id: string, usuarioId: string, decision: "APROBAR" | "RECHAZAR") {
  const actual = await buscarPresupuestoParaValidar(id, usuarioId);
  if (!actual) return { resultado: "NO_EXISTE" } as const;
  const motivos = decision === "APROBAR" ? validarAprobacionPresupuesto(actual) : validarRechazoPresupuesto(actual);
  if (motivos.length) return { resultado: "RECHAZADO", motivos } as const;
  const presupuesto = decision === "APROBAR"
    ? await marcarPresupuestoAprobado(id, actual.ordenTrabajoId)
    : await marcarPresupuestoRechazado(id);
  return { resultado: "DECIDIDO", presupuesto } as const;
}
