import { z } from "zod";

export const vehiculoSchema = z.object({
  // "ab 123 cd" y "AB123CD" son la misma patente (RN02): se guarda normalizada.
  patente: z
    .string()
    .transform((valor) => valor.replace(/\s+/g, "").toUpperCase())
    .pipe(
      z
        .string()
        .min(6, "La patente debe tener al menos 6 caracteres")
        .max(10, "La patente no puede superar los 10 caracteres"),
    ),

  marca: z
    .string()
    .trim()
    .min(2, "La marca debe tener al menos 2 caracteres")
    .max(50, "La marca no puede superar los 50 caracteres"),

  modelo: z
    .string()
    .trim()
    .min(1, "El modelo es obligatorio")
    .max(50, "El modelo no puede superar los 50 caracteres"),

  anio: z
    .number({ invalid_type_error: "El año debe ser un número" })
    .int("El año debe ser un número entero")
    .min(1900, "El año no puede ser anterior a 1900")
    .refine(
      (val) => val <= new Date().getFullYear() + 1,
      "El año del vehículo no es válido",
    )
    .optional(),
});

export type VehiculoInput = z.infer<typeof vehiculoSchema>;

export const actualizarVehiculoSchema = vehiculoSchema.partial().refine(
  (datos) => Object.keys(datos).length > 0,
  { message: "Debe indicar al menos un campo para modificar" },
);

export type ActualizarVehiculoInput = z.infer<typeof actualizarVehiculoSchema>;
