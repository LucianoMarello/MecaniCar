"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth";
import { crearTurno } from "@/lib/db/turnos";
import {
  fechaHoraArgentina,
  leerTexto,
  type EstadoFormulario,
} from "@/lib/formularios";
import { turnoSchema } from "@/lib/schemas/turno";

// Endpoint público con otra sintaxis: verifica todo como POST /api/turnos.
export async function solicitarTurno(
  _estadoAnterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  // 1. Sesión y rol
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  if (usuario.rol !== "CLIENTE") {
    return { mensaje: "Solo un cliente puede solicitar turnos." };
  }

  // 2. Validación, con el mismo schema que la API
  const valores = {
    vehiculoId: leerTexto(formData, "vehiculoId"),
    fechaHora: leerTexto(formData, "fechaHora"),
    motivo: leerTexto(formData, "motivo"),
  };
  const validacion = turnoSchema.safeParse({
    ...valores,
    fechaHora: fechaHoraArgentina(valores.fechaHora),
  });
  if (!validacion.success) {
    return { errores: validacion.error.flatten().fieldErrors, valores };
  }

  // 3 y 4. El vehículo tiene que ser del cliente de la sesión (RN05).
  const resultado = await crearTurno(validacion.data, usuario.id);
  if (resultado.resultado === "VEHICULO_NO_EXISTE") {
    return {
      mensaje: "El vehículo elegido no está entre tus vehículos registrados.",
      valores,
    };
  }

  // 5. El listado de turnos quedó viejo.
  revalidatePath("/turnos");
  redirect(`/turnos/${resultado.turno.id}`);
}
