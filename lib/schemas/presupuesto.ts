import { z } from "zod";

export const estadoPresupuestoSchema = z.enum([
  "PENDIENTE",
  "APROBADO",
  "RECHAZADO",
]);

export type EstadoPresupuesto = z.infer<
  typeof estadoPresupuestoSchema
>;

export const presupuestoSchema = z.object({
  ordenTrabajoId: z
    .string()
    .min(1, "Debe indicar una orden de trabajo"),

  serviciosIds: z
    .array(
      z.string().min(1, "El identificador del servicio no es válido"),
    )
    .min(1, "El presupuesto debe contener al menos un servicio"),
});

export type PresupuestoInput = z.infer<
  typeof presupuestoSchema
>;