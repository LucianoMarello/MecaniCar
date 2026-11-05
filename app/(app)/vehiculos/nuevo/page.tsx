import { notFound, redirect } from "next/navigation";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { obtenerUsuario } from "@/lib/auth";
import { FormularioVehiculo } from "./FormularioVehiculo";

// Esconder la pantalla al taller es cortesía; lo que lo impide está en acciones.ts.
export default async function NuevoVehiculo() {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  if (usuario.rol !== "CLIENTE") notFound();

  return (
    <main id="contenido" className="min-w-0 max-w-lg">
      <EncabezadoPagina
        titulo="Registrar vehículo"
        descripcion="Con la patente, la marca y el modelo ya podés pedir turnos para este vehículo."
        volver={{ href: "/vehiculos", texto: "Mis vehículos" }}
      />
      <FormularioVehiculo />
    </main>
  );
}
