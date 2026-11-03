import { z } from "zod";
import { idSchema } from "./http";

// Solo admite el listado o un detalle del sistema, nunca una URL externa.
export const destinoIngresoSchema = z.string().refine((valor) => {
  if (valor === "/vehiculos") return true;
  const partes = valor.split("/");
  return (
    partes.length === 3 &&
    partes[1] === "vehiculos" &&
    idSchema.safeParse(partes[2]).success
  );
});

export function destinoIngreso(valor: unknown): string {
  const resultado = destinoIngresoSchema.safeParse(valor);
  return resultado.success ? resultado.data : "/vehiculos";
}
