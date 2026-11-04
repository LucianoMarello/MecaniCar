"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth";
import { crearVehiculo } from "@/lib/db/vehiculos";
import { leerTexto, type EstadoFormulario } from "@/lib/formularios";
import { vehiculoSchema } from "@/lib/schemas/vehiculo";

// "use server" publica esta función como un endpoint: se puede llamar sin
// pasar por el formulario, así que verifica todo como un Route Handler.
export async function registrarVehiculo(
  _estadoAnterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  // 1. Sesión y rol
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  if (usuario.rol !== "CLIENTE") {
    return { mensaje: "Solo un cliente puede registrar vehículos." };
  }

  // 2. Validación, con el mismo schema que POST /api/vehiculos
  const valores = {
    patente: leerTexto(formData, "patente"),
    marca: leerTexto(formData, "marca"),
    modelo: leerTexto(formData, "modelo"),
    anio: leerTexto(formData, "anio"),
  };
  const anio = valores.anio.trim();
  const validacion = vehiculoSchema.safeParse({
    ...valores,
    anio: anio === "" ? undefined : Number(anio),
  });
  if (!validacion.success) {
    return { errores: validacion.error.flatten().fieldErrors, valores };
  }

  // 3 y 4. Regla de negocio y escritura. El dueño sale de la sesión, nunca del formulario.
  const resultado = await crearVehiculo(validacion.data, usuario.id);
  if (resultado.resultado === "PATENTE_DUPLICADA") {
    return {
      mensaje: `Ya hay un vehículo registrado con la patente ${validacion.data.patente}. Si es tuyo, lo encontrás en Mis vehículos; si no, consultá con el taller.`,
      valores,
    };
  }

  // 5. El listado quedó viejo. redirect lanza una excepción: va siempre al final.
  revalidatePath("/vehiculos");
  redirect(`/vehiculos/${resultado.vehiculo.id}`);
}
