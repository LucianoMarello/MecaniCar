import { notFound, redirect } from "next/navigation";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { EstadoTrabajo } from "@/components/EstadoTrabajo";
import { obtenerUsuario } from "@/lib/auth";
import { buscarOrden } from "@/lib/db/ordenes-trabajo";
import { idSchema } from "@/lib/schemas/http";
import { AccionesOrden } from "./acciones-ui";

export default async function DetalleOrden({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  const id = idSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const resultado = await buscarOrden(id.data, usuario.id, usuario.rol);
  if (resultado.resultado !== "OK") notFound();
  const { orden } = resultado;
  return <main id="contenido"><EncabezadoPagina titulo={`Orden ${orden.id}`} descripcion={`${orden.vehiculo.patente} · ${orden.vehiculo.marca} ${orden.vehiculo.modelo}`} volver={{ href: "/ordenes-trabajo", texto: "Órdenes de trabajo" }} /><dl className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">Estado</dt><dd><EstadoTrabajo estado={orden.estado} /></dd></div><div><dt className="text-sm text-muted-foreground">Fecha de ingreso</dt><dd>{new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" }).format(orden.fechaIngreso)}</dd></div></dl>{usuario.rol !== "CLIENTE" && <AccionesOrden id={orden.id} estado={orden.estado} />}</main>;
}
