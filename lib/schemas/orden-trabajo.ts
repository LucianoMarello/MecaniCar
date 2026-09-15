import { z } from "zod";

export const estadoOrdenTrabajoSchema = z.enum([
  "ABIERTA",
  "EN_REPARACION",
  "FINALIZADA",
]);

export type EstadoOrdenTrabajo = z.infer<
  typeof estadoOrdenTrabajoSchema
>;

export const ordenTrabajoSchema = z.object({
  turnoId: z
    .string()
    .min(1, "Debe indicar el turno asociado"),
});

export type OrdenTrabajoInput = z.infer<
  typeof ordenTrabajoSchema
>;