import { z } from "zod";

export const detallePresupuestoSchema = z.object({
  presupuestoId: z
    .string()
    .min(1, "Debe indicar un presupuesto"),

  servicioId: z
    .string()
    .min(1, "Debe indicar un servicio"),

  precioAplicado: z.coerce
    .number()
    .positive("El precio aplicado debe ser mayor que cero"),
});

export type DetallePresupuestoInput = z.infer<
  typeof detallePresupuestoSchema
>;