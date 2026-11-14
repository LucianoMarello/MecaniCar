/** Dónde quedan las sesiones de prueba que arma `preparar.ts`. */
import path from "node:path";

const carpeta = path.join(__dirname, ".sesiones");

export const SESION = {
  cliente: path.join(carpeta, "cliente.json"),
  otroCliente: path.join(carpeta, "otro-cliente.json"),
  mecanico: path.join(carpeta, "mecanico.json"),
  admin: path.join(carpeta, "admin.json"),
} as const;
