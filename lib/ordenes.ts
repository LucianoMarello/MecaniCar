type EstadoOrdenTrabajo = "ABIERTA" | "EN_REPARACION" | "FINALIZADA";
type EstadoPresupuesto = "PENDIENTE" | "APROBADO" | "RECHAZADO";

type DatosOrden = {
  estado: EstadoOrdenTrabajo;
  presupuestos: { estado: EstadoPresupuesto }[];
};

export function validarFinalizacionOrden(orden: DatosOrden): string[] {
  const errores: string[] = [];

  if (orden.estado !== "EN_REPARACION") {
    errores.push("La orden debe estar EN_REPARACION para poder finalizarse");
  }

  const tieneAprobado = orden.presupuestos.some((p) => p.estado === "APROBADO");
  if (!tieneAprobado) {
    errores.push("La orden no tiene ningún presupuesto aprobado");
  }

  return errores;
}
