import { notFound, redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth";
import { buscarVehiculo } from "@/lib/db/vehiculos";
import { idSchema } from "@/lib/schemas/http";
import { formatearFecha } from "@/lib/presentacion";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { Card, CardContent } from "@/components/ui/card";

type Props = { params: Promise<{ id: string }> };

export default async function DetalleVehiculo({ params }: Props) {
  const usuario = await obtenerUsuario();
  const parametros = await params;
  if (!usuario) {
    const destino = `/vehiculos/${encodeURIComponent(parametros.id)}`;
    redirect(`/ingresar?callbackUrl=${encodeURIComponent(destino)}`);
  }
  const validacion = idSchema.safeParse(parametros.id);
  if (!validacion.success) notFound();
  const resultado = await buscarVehiculo(
    validacion.data,
    usuario.id,
    usuario.rol,
  );
  if (resultado.resultado !== "OK") notFound();
  const { vehiculo } = resultado;

  return (
    <main id="contenido" className="min-w-0">
      <EncabezadoPagina
        titulo={`Vehículo ${vehiculo.patente}`}
        descripcion="Datos de registro del vehículo."
        volver={{ href: "/vehiculos", texto: "Vehículos" }}
      />
      <Card>
        <CardContent>
          <dl className="grid min-w-0 gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Patente</dt>
              <dd className="break-words font-medium [overflow-wrap:anywhere]">
                {vehiculo.patente}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Marca</dt>
              <dd className="break-words font-medium [overflow-wrap:anywhere]">
                {vehiculo.marca}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Modelo</dt>
              <dd className="break-words font-medium [overflow-wrap:anywhere]">
                {vehiculo.modelo}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Año</dt>
              <dd className="font-medium">{vehiculo.anio}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Fecha de registro
              </dt>
              <dd>{formatearFecha(vehiculo.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Última actualización
              </dt>
              <dd>{formatearFecha(vehiculo.updatedAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <p className="mt-4 text-sm text-muted-foreground">
        Horarios expresados en la zona de Buenos Aires.
      </p>
    </main>
  );
}
