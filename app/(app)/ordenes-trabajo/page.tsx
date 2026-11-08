import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { EstadoTrabajo } from "@/components/EstadoTrabajo";
import { SinDatos } from "@/components/SinDatos";
import { Button } from "@/components/ui/button";
import { obtenerUsuario } from "@/lib/auth";
import { listarOrdenes } from "@/lib/db/ordenes-trabajo";
import { MAX_PAGINAS, paginacionSchema } from "@/lib/schemas/http";
import { formatearFecha } from "@/lib/presentacion";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function OrdenesTrabajo({ searchParams }: Props) {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  const parametros = await searchParams;
  const validacion = paginacionSchema.safeParse({ pagina: parametros.pagina, limite: 20 });
  if (!validacion.success) notFound();
  const { pagina, limite } = validacion.data;
  const ordenes = await listarOrdenes(usuario.id, usuario.rol, validacion.data);
  return (
    <main id="contenido">
      <EncabezadoPagina titulo={usuario.rol === "CLIENTE" ? "Mis reparaciones" : "Órdenes de trabajo"} descripcion="Consultá el estado de ingreso y reparación de cada vehículo." volver={{ href: "/vehiculos", texto: "Vehículos" }} />
      {ordenes.length === 0 ? <SinDatos titulo={pagina === 1 ? "Todavía no hay órdenes de trabajo" : "Llegaste al final del listado"} descripcion={pagina === 1 ? "Las órdenes aparecen cuando un vehículo ingresa al taller con un turno confirmado." : "No hay órdenes en esta página. Usá Página anterior para volver a los resultados."} /> : <ul className="space-y-3">{ordenes.map((orden) => <li key={orden.id} className="rounded-lg border bg-card p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">{orden.vehiculo.patente} · {orden.vehiculo.marca} {orden.vehiculo.modelo}</p><p className="text-sm text-muted-foreground">Ingreso: {formatearFecha(orden.fechaIngreso)}</p></div><EstadoTrabajo estado={orden.estado} /><Button asChild variant="outline"><Link href={`/ordenes-trabajo/${orden.id}`}>Ver orden</Link></Button></div></li>)}</ul>}
      <nav aria-label="Páginas de órdenes" className="mt-8 flex flex-wrap items-center gap-3">
        {pagina > 1 && <Button asChild variant="outline"><Link href={`/ordenes-trabajo?pagina=${pagina - 1}`}>Página anterior</Link></Button>}
        <span aria-current="page">Página {pagina}</span>
        {ordenes.length === limite && pagina < MAX_PAGINAS && <Button asChild variant="outline"><Link href={`/ordenes-trabajo?pagina=${pagina + 1}`}>Página siguiente</Link></Button>}
      </nav>
    </main>
  );
}
