import { z } from "zod";

export const estadoTurnoSchema = z.enum([
  "PENDIENTE",
  "CONFIRMADO",
  "CANCELADO",
]);

export type EstadoTurno = z.infer<typeof estadoTurnoSchema>;

export const turnoSchema = z.object({
  vehiculoId: z
    .string()
    .min(1, "Debe seleccionar un vehículo"),

  fechaHora: z.coerce
    .date()
    .refine(
      (fecha) => fecha > new Date(),
      "La fecha del turno debe ser posterior a la fecha actual",
    ),

  motivo: z
    .string()
    .trim()
    .min(5, "El motivo debe tener al menos 5 caracteres")
    .max(500, "El motivo no puede superar los 500 caracteres"),
});

export type TurnoInput = z.infer<typeof turnoSchema>;