import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth";
import { buscarVehiculo } from "@/lib/db/vehiculos";
import { idSchema } from "@/lib/schemas/http";

type Props = { params: Promise<{ id: string }> };

// Reutiliza la consulta autorizada del endpoint GET /api/vehiculos/:id.
export default async function DetalleVehiculo({ params }: Props) {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/api/auth/signin?callbackUrl=%2Fvehiculos");

  const validacion = idSchema.safeParse((await params).id);
  if (!validacion.success) notFound();

  const resultado = await buscarVehiculo(
    validacion.data,
    usuario.id,
    usuario.rol,
  );
  if (resultado.resultado !== "OK") notFound();

  const { vehiculo } = resultado;
  // Se formatea en el servidor con zona explícita para evitar diferencias UTC/AR.
  const fecha = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  return (
    <main className="mx-auto max-w-2xl p-6 sm:p-8">
      <Link
        href="/vehiculos"
        className="underline focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        Volver a vehículos
      </Link>
      <h1 className="mt-6 text-3xl font-bold">Vehículo {vehiculo.patente}</h1>
      <dl className="mt-6 grid grid-cols-1 gap-4 rounded-md border border-foreground/20 p-5 sm:grid-cols-2">
        <div>
          <dt className="font-semibold">Patente</dt>
          <dd>{vehiculo.patente}</dd>
        </div>
        <div>
          <dt className="font-semibold">Marca</dt>
          <dd>{vehiculo.marca}</dd>
        </div>
        <div>
          <dt className="font-semibold">Modelo</dt>
          <dd>{vehiculo.modelo}</dd>
        </div>
        <div>
          <dt className="font-semibold">Año</dt>
          <dd>{vehiculo.anio}</dd>
        </div>
        <div>
          <dt className="font-semibold">Fecha de registro</dt>
          <dd>{fecha.format(vehiculo.createdAt)}</dd>
        </div>
        <div>
          <dt className="font-semibold">Última actualización</dt>
          <dd>{fecha.format(vehiculo.updatedAt)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm">
        Horarios expresados en la zona de Buenos Aires.
      </p>
    </main>
  );
}
