import type { EstadoPresupuesto, EstadoOrdenTrabajo } from "@prisma/client";

// Solo necesitamos el estado actual para tomar la decisión
type DatosPresupuesto = {
  estado: EstadoPresupuesto;
};

export function validarRechazoPresupuesto(
  presupuesto: DatosPresupuesto,
): string[] {
  const errores: string[] = [];

  if (presupuesto.estado !== "PENDIENTE") {
    errores.push("Solo puede rechazarse un presupuesto pendiente");
  }

  return errores;
}

export function validarAprobacionPresupuesto(
  presupuesto: DatosPresupuesto,
): string[] {
  const errores: string[] = [];

  if (presupuesto.estado !== "PENDIENTE") {
    errores.push("Solamente puede aprobarse un presupuesto pendiente");
  }

  return errores;
}

type DatosOrdenParaPresupuesto = {
  estado: EstadoOrdenTrabajo;
};

export function validarCreacionPresupuesto(
  orden: DatosOrdenParaPresupuesto,
): string[] {
  const errores: string[] = [];

  if (orden.estado === "FINALIZADA") {
    errores.push("No se puede presupuestar una orden finalizada");
  }

  return errores;
}
