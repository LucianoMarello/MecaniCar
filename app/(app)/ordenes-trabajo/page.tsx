import Link from "next/link";
import { redirect } from "next/navigation";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { EstadoTrabajo } from "@/components/EstadoTrabajo";
import { SinDatos } from "@/components/SinDatos";
import { Button } from "@/components/ui/button";
import { obtenerUsuario } from "@/lib/auth";
import { listarOrdenes } from "@/lib/db/ordenes-trabajo";

export default async function OrdenesTrabajo() {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  const ordenes = await listarOrdenes(usuario.id, usuario.rol);
  return <main id="contenido"><EncabezadoPagina titulo={usuario.rol === "CLIENTE" ? "Mis reparaciones" : "Órdenes de trabajo"} descripcion="Consultá el estado de ingreso y reparación de cada vehículo." volver={{ href: "/vehiculos", texto: "Vehículos" }} />
    {ordenes.length === 0 ? <SinDatos titulo="Todavía no hay órdenes de trabajo" descripcion="Las órdenes aparecen cuando un vehículo ingresa al taller con un turno confirmado." /> : <ul className="space-y-3">{ordenes.map((orden) => <li key={orden.id} className="rounded-lg border bg-card p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">{orden.vehiculo.patente} · {orden.vehiculo.marca} {orden.vehiculo.modelo}</p><p className="text-sm text-muted-foreground">Ingreso: {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" }).format(orden.fechaIngreso)}</p></div><EstadoTrabajo estado={orden.estado} /><Button asChild variant="outline"><Link href={`/ordenes-trabajo/${orden.id}`}>Ver orden</Link></Button></div></li>)}</ul>}
  </main>;
}
