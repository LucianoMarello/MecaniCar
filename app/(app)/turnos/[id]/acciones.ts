"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth";
import {
  cancelarTurno,
  confirmarTurno,
  registrarIngreso,
} from "@/lib/casos/turnos";
import { ConflictoNegocio } from "@/lib/errores";
import { SIN_ENVIAR, type EstadoFormulario } from "@/lib/formularios";
import { idSchema } from "@/lib/schemas/http";

// Botones sin campos: el turno llega por .bind() desde la pantalla y quién lo
// pide sale de la sesión. useActionState también pasa el estado anterior y el
// formData, pero estas acciones no los declaran porque no leen nada de ahí.

const NO_EXISTE = "El turno no existe.";
const CONFLICTO =
  "El turno cambió mientras se procesaba. Actualizá la página e intentá de nuevo.";

// Si otro pedido cambió el turno entre la lectura y la escritura, el caso
// lanza en vez de devolver. Ese error pasa a ser un resultado más; cualquier
// otro se relanza.
async function capturarConflicto<T>(caso: Promise<T>) {
  try {
    return await caso;
  } catch (error) {
    if (
      error instanceof ConflictoNegocio ||
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2002", "P2034"].includes(error.code))
    ) {
      return { resultado: "CONFLICTO" } as const;
    }
    throw error;
  }
}

export async function confirmarTurnoAction(
  turnoId: string,
): Promise<EstadoFormulario> {
  // 1. Sesión y rol
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  if (usuario.rol !== "MECANICO" && usuario.rol !== "ADMIN") {
    return { mensaje: "Solo el personal del taller puede confirmar turnos." };
  }

  // 2. Entrada: viene de .bind(), pero igual puede llegar manipulada.
  const id = idSchema.safeParse(turnoId);
  if (!id.success) return { mensaje: NO_EXISTE };

  // 3 y 4. Regla, escritura y aviso: los decide el caso, como en la API.
  const resultado = await capturarConflicto(confirmarTurno(id.data));

  // 5. Respuesta
  if (resultado.resultado === "CONFLICTO") return { mensaje: CONFLICTO };
  if (resultado.resultado === "NO_EXISTE") return { mensaje: NO_EXISTE };
  if (resultado.resultado === "RECHAZADO") {
    return { mensaje: resultado.motivos.join(". ") };
  }
  revalidatePath("/turnos");
  revalidatePath(`/turnos/${id.data}`);
  if (!resultado.avisoEnviado) {
    return {
      aviso: "Avisale al cliente por otro medio que su turno quedó confirmado.",
    };
  }
  return SIN_ENVIAR;
}

export async function cancelarTurnoAction(
  turnoId: string,
): Promise<EstadoFormulario> {
  // 1. Sesión y rol
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  if (usuario.rol !== "CLIENTE") {
    return { mensaje: "Solo un cliente puede cancelar sus turnos." };
  }

  // 2. Entrada
  const id = idSchema.safeParse(turnoId);
  if (!id.success) return { mensaje: NO_EXISTE };

  // 3 y 4. El caso solo encuentra los turnos del cliente de la sesión.
  const resultado = await capturarConflicto(cancelarTurno(id.data, usuario.id));

  // 5. Respuesta
  if (resultado.resultado === "CONFLICTO") return { mensaje: CONFLICTO };
  if (resultado.resultado === "NO_EXISTE") return { mensaje: NO_EXISTE };
  if (resultado.resultado === "RECHAZADO") {
    return { mensaje: resultado.motivos.join(". ") };
  }
  revalidatePath("/turnos");
  revalidatePath(`/turnos/${id.data}`);
  return SIN_ENVIAR;
}

export async function registrarIngresoAction(
  turnoId: string,
): Promise<EstadoFormulario> {
  // 1. Sesión y rol
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  if (usuario.rol !== "MECANICO" && usuario.rol !== "ADMIN") {
    return { mensaje: "Solo el personal del taller puede registrar el ingreso." };
  }

  // 2. Entrada
  const id = idSchema.safeParse(turnoId);
  if (!id.success) return { mensaje: NO_EXISTE };

  // 3 y 4. Regla y creación de la orden
  const resultado = await capturarConflicto(registrarIngreso(id.data));

  // 5. Respuesta. redirect lanza una excepción: va al final y fuera del try.
  if (resultado.resultado === "CONFLICTO") return { mensaje: CONFLICTO };
  if (resultado.resultado === "NO_EXISTE") return { mensaje: NO_EXISTE };
  if (resultado.resultado === "RECHAZADO") {
    return { mensaje: resultado.motivos.join(". ") };
  }
  revalidatePath("/turnos");
  revalidatePath(`/turnos/${id.data}`);
  revalidatePath("/ordenes-trabajo");
  redirect(`/ordenes-trabajo/${resultado.orden.id}`);
}
