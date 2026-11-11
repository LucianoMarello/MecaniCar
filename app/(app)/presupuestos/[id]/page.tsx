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
  const preciosHistoricos = Object.fromEntries(
    presupuesto.detalles.map((detalle) => [
      detalle.servicio.id,
      detalle.precioAplicado.toString(),
    ]),
  );
  return (
    <main id="contenido">
      <EncabezadoPagina titulo={`Presupuesto · ${presupuesto.ordenTrabajo.vehiculo.patente}`} descripcion={`Reparación ${presupuesto.ordenTrabajo.id}`} volver={{ href: "/presupuestos", texto: "Presupuestos" }} />
      {query.aviso === "pendiente" && esTaller && <Alert variant="destructive"><AlertTitle>El presupuesto se guardó, pero el aviso no pudo enviarse</AlertTitle><AlertDescription>Avisale al cliente por otro medio que tiene un presupuesto pendiente de revisión.</AlertDescription></Alert>}
      {!esTaller && presupuesto.estado === "APROBADO" && (
        <p role="status" className="mb-4 rounded-md border p-4">
          Presupuesto aprobado. El taller ya puede avanzar con la reparación.
        </p>
      )}
      {!esTaller && presupuesto.estado === "RECHAZADO" && (
        <p role="status" className="mb-4 rounded-md border p-4">
          Presupuesto rechazado. El taller deberá actualizarlo para que puedas
          revisarlo nuevamente.
        </p>
      )}
      <section className="space-y-5 rounded-lg border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><EstadoTrabajo estado={presupuesto.estado} /><span>Creado {formatearFecha(presupuesto.fechaCreacion)}</span></div>
        <ul className="divide-y">{presupuesto.detalles.map((detalle) => <li key={detalle.id} className="flex justify-between gap-4 py-3"><span>{detalle.servicio.nombre}</span><span>{formatearImporte(Number(detalle.precioAplicado))}</span></li>)}</ul>
        <p className="text-right text-lg font-semibold">Total: {formatearImporte(presupuesto.total)}</p>
      </section>
      {esTaller && servicios.length > 0 && <section className="mt-8 space-y-4"><h2 className="text-xl font-semibold">Editar presupuesto</h2><p>Cualquier cambio devuelve el presupuesto a pendiente y reabre la orden. Los servicios ya incluidos conservan su precio histórico.</p><FormularioServicios totalPaginas={totalPaginasServicios} accion={editar} etiqueta="Guardar cambios" preciosHistoricos={preciosHistoricos} servicios={servicios.map((servicio) => ({ id: servicio.id, nombre: servicio.nombre, precio: servicio.precioActual.toString(), seleccionado: preciosHistoricos[servicio.id] !== undefined }))} /></section>}
      {!esTaller && presupuesto.estado === "PENDIENTE" && <AccionesPresupuesto id={presupuesto.id} />}
    </main>
  );
}
