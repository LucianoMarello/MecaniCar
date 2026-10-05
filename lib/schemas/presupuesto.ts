import { idSchema } from "./http";
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
  ordenTrabajoId: idSchema,

  serviciosIds: z
    .array(
      idSchema,
    )
    .min(1, "El presupuesto debe contener al menos un servicio"),
});

export type PresupuestoInput = z.infer<
  typeof presupuestoSchema
>;
export const editarPresupuestoSchema = presupuestoSchema.pick({ serviciosIds: true });
