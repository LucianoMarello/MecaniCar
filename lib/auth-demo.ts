import type { Rol } from "@prisma/client";

export type SesionDemo = { usuarioId: string; rol: Rol };

export function obtenerSesionDemo(): SesionDemo {
  // TODO (clase 6): reemplazar por la sesión real del servidor.
  if (process.env.DEMO_ROLE === "MECANICO") {
    return { usuarioId: "usuario-mecanico-demo", rol: "MECANICO" };
  }
  return { usuarioId: "usuario-cliente-demo", rol: "CLIENTE" };
}
