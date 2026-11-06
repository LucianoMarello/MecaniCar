import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { SinDatos } from "@/components/SinDatos";
import { Button } from "@/components/ui/button";
import { obtenerUsuario } from "@/lib/auth";
import { listarVehiculos } from "@/lib/db/vehiculos";
import { idSchema } from "@/lib/schemas/http";
import { FormularioTurno } from "./FormularioTurno";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NuevoTurno({ searchParams }: Props) {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  if (usuario.rol !== "CLIENTE") notFound();
  const { vehiculo } = await searchParams;
  // El máximo de una página (RN43) alcanza para los vehículos de un cliente.
  const vehiculos = await listarVehiculos(usuario.id, usuario.rol, {
    pagina: 1,
    limite: 100,
  });
  const opciones = vehiculos.map(({ id, patente, marca, modelo }) => ({
    id,
    etiqueta: `${patente} · ${marca} ${modelo}`,
  }));
  // ?vehiculo= solo preselecciona si es un id válido y uno de los propios.
  const pedido = idSchema.safeParse(vehiculo);
  const vehiculoInicial = pedido.success
    ? (opciones.find(({ id }) => id === pedido.data)?.id ?? "")
    : "";

  return (
    <main id="contenido" className="min-w-0 max-w-lg">
      <EncabezadoPagina
        titulo="Solicitar turno"
        descripcion="Elegí el vehículo, el día y contá qué le pasa. El turno queda pendiente hasta que el taller lo confirme."
        volver={{ href: "/turnos", texto: "Mis turnos" }}
      />
      {opciones.length === 0 ? (
        <SinDatos
          titulo="Primero registrá un vehículo"
          descripcion="Para pedir un turno necesitás tener al menos un vehículo registrado."
        >
          <Button asChild className="w-full sm:w-auto">
            <Link href="/vehiculos/nuevo">Registrar vehículo</Link>
          </Button>
        </SinDatos>
      ) : (
        <FormularioTurno
          vehiculos={opciones}
          vehiculoInicial={vehiculoInicial}
        />
      )}
    </main>
  );
}
