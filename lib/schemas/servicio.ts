import { z } from "zod";

export const servicioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres"),

  descripcion: z
    .string()
    .trim()
    .max(500, "La descripción no puede superar los 500 caracteres")
    .optional(),

  precio: z.coerce
    .number()
    .positive("El precio debe ser mayor que cero"),
});

export type ServicioInput = z.infer<typeof servicioSchema>;