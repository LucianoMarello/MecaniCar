import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { EstadoTrabajo } from "@/components/EstadoTrabajo";
import { obtenerUsuario } from "@/lib/auth";
import { buscarOrden } from "@/lib/db/ordenes-trabajo";
import { buscarPresupuestoDeOrden } from "@/lib/db/presupuestos";
import { formatearFecha } from "@/lib/presentacion";
import { idSchema } from "@/lib/schemas/http";
import { AccionesOrden } from "./AccionesOrden";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string | string[] }>;
};

export default async function DetalleOrden({ params, searchParams }: Props) {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  const id = idSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const resultado = await buscarOrden(id.data, usuario.id, usuario.rol);
  if (resultado.resultado !== "OK") notFound();

  const { orden } = resultado;
  const presupuestoExistente = usuario.rol === "CLIENTE" ? null : await buscarPresupuestoDeOrden(orden.id);
  const parametros = await searchParams;
  const avisoPendiente = parametros.aviso === "pendiente";

  return (
    <main id="contenido">
      <EncabezadoPagina
        titulo={`Reparación ${orden.vehiculo.patente}`}
        descripcion={`${orden.vehiculo.marca} ${orden.vehiculo.modelo}`}
        volver={{ href: "/ordenes-trabajo", texto: "Órdenes de trabajo" }}
      />
      {avisoPendiente && usuario.rol !== "CLIENTE" && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>La reparación se finalizó, pero el aviso no pudo enviarse</AlertTitle>
          <AlertDescription>
            Avisale al cliente por otro medio que su vehículo está listo para retirar.
          </AlertDescription>
        </Alert>
      )}
      <dl className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Estado</dt>
          <dd><EstadoTrabajo estado={orden.estado} /></dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Fecha de ingreso</dt>
          <dd>{formatearFecha(orden.fechaIngreso)}</dd>
        </div>
      </dl>
      {usuario.rol !== "CLIENTE" && (
        <>
          {orden.estado !== "FINALIZADA" && !presupuestoExistente && (
            <div className="mt-6"><Link className="underline underline-offset-4" href={`/presupuestos/nuevo?orden=${orden.id}`}>Crear presupuesto</Link></div>
          )}
          <AccionesOrden id={orden.id} estado={orden.estado} />
        </>
      )}
    </main>
  );
}
