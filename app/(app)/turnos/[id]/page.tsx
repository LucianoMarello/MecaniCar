import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { EstadoTrabajo } from "@/components/EstadoTrabajo";
import { Card, CardContent } from "@/components/ui/card";
import { obtenerUsuario } from "@/lib/auth";
import { buscarTurno } from "@/lib/db/turnos";
import { formatearFecha } from "@/lib/presentacion";
import { idSchema } from "@/lib/schemas/http";

type Props = { params: Promise<{ id: string }> };

export default async function DetalleTurno({ params }: Props) {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  const validacion = idSchema.safeParse((await params).id);
  if (!validacion.success) notFound();
  // Misma consulta que GET /api/turnos/:id: el cliente solo encuentra los suyos.
  const resultado = await buscarTurno(validacion.data, usuario.id, usuario.rol);
  if (resultado.resultado !== "OK") notFound();
  const { turno } = resultado;
  const esCliente = usuario.rol === "CLIENTE";

  return (
    <main id="contenido" className="min-w-0">
      <EncabezadoPagina
        titulo={`Turno del ${formatearFecha(turno.fechaHora)}`}
        descripcion="Datos del turno y su estado."
        volver={{ href: "/turnos", texto: esCliente ? "Mis turnos" : "Turnos" }}
      />
      <Card>
        <CardContent>
          <dl className="grid min-w-0 gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Estado</dt>
              <dd className="mt-1">
                <EstadoTrabajo estado={turno.estado} />
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Vehículo</dt>
              <dd className="break-words font-medium [overflow-wrap:anywhere]">
                <Link
                  href={`/vehiculos/${turno.vehiculo.id}`}
                  className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
                >
                  {turno.vehiculo.patente}
                </Link>{" "}
                · {turno.vehiculo.marca} {turno.vehiculo.modelo}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Fecha y hora</dt>
              <dd>{formatearFecha(turno.fechaHora)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Solicitado el</dt>
              <dd>{formatearFecha(turno.fechaCreacion)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Motivo</dt>
              <dd className="whitespace-pre-line break-words [overflow-wrap:anywhere]">
                {turno.motivo}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Ingreso al taller</dt>
              <dd>
                {turno.ordenTrabajo
                  ? "Registrado: el vehículo ya tiene una orden de trabajo."
                  : "Todavía no ingresó al taller."}
              </dd>
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
