import { notFound, redirect } from "next/navigation";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { EstadoTrabajo } from "@/components/EstadoTrabajo";
import { obtenerUsuario } from "@/lib/auth";
import { buscarPresupuesto } from "@/lib/db/presupuestos";
import { formatearFecha } from "@/lib/presentacion";
import { idSchema } from "@/lib/schemas/http";

export default async function DetallePresupuesto({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  const id = idSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const resultado = await buscarPresupuesto(id.data, usuario.id, usuario.rol);
  if (resultado.resultado !== "OK") notFound();
  const { presupuesto } = resultado;
  return (
    <main id="contenido">
      <EncabezadoPagina titulo={`Presupuesto · ${presupuesto.ordenTrabajo.vehiculo.patente}`} descripcion={`Reparación ${presupuesto.ordenTrabajo.id}`} volver={{ href: "/presupuestos", texto: "Presupuestos" }} />
      <section className="space-y-5 rounded-lg border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><EstadoTrabajo estado={presupuesto.estado} /><span className="text-sm text-muted-foreground">Creado {formatearFecha(presupuesto.fechaCreacion)}</span></div>
        <ul className="divide-y">{presupuesto.detalles.map((detalle) => <li key={detalle.id} className="flex justify-between gap-4 py-3"><span>{detalle.servicio.nombre}</span><span>${detalle.precioAplicado.toFixed(2)}</span></li>)}</ul>
        <p className="text-right text-lg font-semibold">Total: ${presupuesto.total}</p>
      </section>
      <p className="mt-4 text-sm text-muted-foreground">Los precios reflejan el valor acordado al emitir cada detalle del presupuesto.</p>
    </main>
  );
}
