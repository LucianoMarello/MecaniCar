import type { Rol } from "@prisma/client";

export const nombreRol: Record<Rol, string> = {
  CLIENTE: "Cliente",
  MECANICO: "Mecánico",
  ADMIN: "Administrador",
};

export function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(fecha);
}
