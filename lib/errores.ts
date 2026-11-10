import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { NoAutenticado, NoAutorizado } from "@/lib/auth";
export class ConflictoNegocio extends Error {}
// Otro pedido cambió los datos entre la lectura y la escritura. Lo detecta la
// regla dentro de la transacción (ConflictoNegocio) o la base: P2002 (índice
// único) o P2034 (transacción serializable abortada).
export function esConflicto(error: unknown) {
  return (
    error instanceof ConflictoNegocio ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2002", "P2034"].includes(error.code))
  );
}
export function responderError(endpoint: string, error: unknown) {
  if (error instanceof NoAutenticado) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof NoAutorizado) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: "Datos inválidos", detalles: error.flatten() },
      { status: 400 },
    );
  if (esConflicto(error))
    return NextResponse.json(
      {
        error:
          error instanceof ConflictoNegocio
            ? error.message
            : "Conflicto: actualice los datos y vuelva a intentar",
      },
      { status: 409 },
    );
  console.error(endpoint, error);
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}
