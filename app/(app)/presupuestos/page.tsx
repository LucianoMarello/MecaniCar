import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { EstadoTrabajo } from "@/components/EstadoTrabajo";
import { SinDatos } from "@/components/SinDatos";
import { Button } from "@/components/ui/button";
import { obtenerUsuario } from "@/lib/auth";
import { contarPresupuestos, listarPresupuestos } from "@/lib/db/presupuestos";
import { formatearFecha } from "@/lib/presentacion";
import { formatearImporte } from "@/lib/presentacion";
import { MAX_PAGINAS, paginacionSchema } from "@/lib/schemas/http";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Presupuestos({ searchParams }: Props) {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  const query = await searchParams;
  const validacion = paginacionSchema.safeParse({ pagina: query.pagina, limite: 20 });
  if (!validacion.success) notFound();
  const { pagina, limite } = validacion.data;
  const presupuestos = await listarPresupuestos(usuario.id, usuario.rol, validacion.data);
  const total = await contarPresupuestos(usuario.id, usuario.rol);
  const haySiguiente = pagina * limite < total;
  return (
    <main id="contenido">
      <EncabezadoPagina titulo={usuario.rol === "CLIENTE" ? "Mis presupuestos" : "Presupuestos"} descripcion="Consultá los presupuestos de las reparaciones y sus estados." />
      {presupuestos.length === 0 ? <SinDatos titulo={pagina === 1 ? "Todavía no hay presupuestos" : "Llegaste al final del listado"} descripcion={pagina === 1 ? "Cuando el taller prepare un presupuesto para una reparación, aparecerá acá." : "No hay presupuestos en esta página. Usá Página anterior para volver."} /> : (
        <ul className="space-y-3">{presupuestos.map((presupuesto) => (
          <li key={presupuesto.id} className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-medium">{presupuesto.ordenTrabajo.vehiculo.patente} · Presupuesto {presupuesto.id}</p><p className="text-sm text-muted-foreground">Creado: {formatearFecha(presupuesto.fechaCreacion)} · Total: {formatearImporte(presupuesto.total)}</p></div>
              <EstadoTrabajo estado={presupuesto.estado} />
              <Button asChild variant="outline"><Link href={`/presupuestos/${presupuesto.id}`}>Ver presupuesto</Link></Button>
            </div>
          </li>
        ))}</ul>
      )}
      <nav aria-label="Páginas de presupuestos" className="mt-8 flex flex-wrap items-center gap-3">
        {pagina > 1 && <Button asChild variant="outline"><Link href={`/presupuestos?pagina=${pagina - 1}`}>Página anterior</Link></Button>}
        <span aria-current="page">Página {pagina}</span>
        {haySiguiente && pagina < MAX_PAGINAS && <Button asChild variant="outline"><Link href={`/presupuestos?pagina=${pagina + 1}`}>Página siguiente</Link></Button>}
      </nav>
    </main>
  );
}
