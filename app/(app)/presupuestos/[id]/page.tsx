import { notFound, redirect } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { EstadoTrabajo } from "@/components/EstadoTrabajo";
import { obtenerUsuario } from "@/lib/auth";
import { buscarPresupuesto } from "@/lib/db/presupuestos";
import { contarServicios, listarServicios } from "@/lib/db/servicios";
import { formatearFecha, formatearImporte } from "@/lib/presentacion";
import { idSchema } from "@/lib/schemas/http";
import { FormularioServicios } from "../FormularioServicios";
import { editarPresupuestoAction } from "../acciones";
import { AccionesPresupuesto } from "./AccionesPresupuesto";

export default async function DetallePresupuesto({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ aviso?: string | string[] }> }) {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  const id = idSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const resultado = await buscarPresupuesto(id.data, usuario.id, usuario.rol);
  if (resultado.resultado !== "OK") notFound();
  const { presupuesto } = resultado;
  const query = await searchParams;
  const esTaller = usuario.rol !== "CLIENTE";
  const servicios = esTaller && presupuesto.ordenTrabajo.estado !== "FINALIZADA" ? await listarServicios({ pagina: 1, limite: 100 }) : [];
  const editar = editarPresupuestoAction.bind(null, presupuesto.id);
  const totalPaginasServicios = servicios.length ? Math.max(1, Math.ceil((await contarServicios()) / 100)) : 1;
  return (
    <main id="contenido">
      <EncabezadoPagina titulo={`Presupuesto · ${presupuesto.ordenTrabajo.vehiculo.patente}`} descripcion={`Reparación ${presupuesto.ordenTrabajo.id}`} volver={{ href: "/presupuestos", texto: "Presupuestos" }} />
      {query.aviso === "pendiente" && esTaller && <Alert variant="destructive"><AlertTitle>El presupuesto se guardó, pero el aviso no pudo enviarse</AlertTitle><AlertDescription>Avisale al cliente por otro medio que tiene un presupuesto pendiente de revisión.</AlertDescription></Alert>}
      <section className="space-y-5 rounded-lg border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><EstadoTrabajo estado={presupuesto.estado} /><span>Creado {formatearFecha(presupuesto.fechaCreacion)}</span></div>
        <ul className="divide-y">{presupuesto.detalles.map((detalle) => <li key={detalle.id} className="flex justify-between gap-4 py-3"><span>{detalle.servicio.nombre}</span><span>{formatearImporte(Number(detalle.precioAplicado))}</span></li>)}</ul>
        <p className="text-right text-lg font-semibold">Total: {formatearImporte(presupuesto.total)}</p>
      </section>
      {esTaller && servicios.length > 0 && <section className="mt-8 space-y-4"><h2 className="text-xl font-semibold">Editar presupuesto</h2><p>Los servicios conservados mantienen su precio histórico; agregar servicios toma su precio actual y devuelve el presupuesto a pendiente.</p><FormularioServicios totalPaginas={totalPaginasServicios} accion={editar} etiqueta="Guardar cambios" servicios={servicios.map((s) => ({ id: s.id, nombre: s.nombre, precio: s.precioActual.toString(), seleccionado: presupuesto.detalles.some((d) => d.servicio.id === s.id) }))} /></section>}
      {!esTaller && presupuesto.estado === "PENDIENTE" && <AccionesPresupuesto id={presupuesto.id} />}
    </main>
  );
}
