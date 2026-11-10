"use client";
import { useActionState, useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SIN_ENVIAR, type EstadoFormulario } from "@/lib/formularios";
import { cargarServiciosAction } from "./acciones";
type ServicioForm = { id: string; nombre: string; precio: string; seleccionado?: boolean };
export function FormularioServicios({ servicios: iniciales, totalPaginas: paginasIniciales, accion, etiqueta }: {
  servicios: ServicioForm[];
  totalPaginas: number;
  accion: (previo: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  etiqueta: string;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, SIN_ENVIAR);
  const [servicios, setServicios] = useState(iniciales);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(paginasIniciales);
  const [seleccionados, setSeleccionados] = useState(() => new Set(iniciales.filter((s) => s.seleccionado).map((s) => s.id)));
  const [cargando, iniciar] = useTransition();
  function ir(destino: number) { iniciar(async () => { const r = await cargarServiciosAction(destino); if (r.resultado === "OK") { setServicios(r.servicios); setPagina(r.pagina); setTotalPaginas(r.totalPaginas); } }); }
  return <form action={enviar} className="space-y-4">
    {estado.mensaje && <Alert variant="destructive"><AlertTitle>No se pudo guardar</AlertTitle><AlertDescription>{estado.mensaje}</AlertDescription></Alert>}
    {estado.aviso && <Alert variant="destructive"><AlertTitle>El presupuesto se guardó, pero el aviso no pudo enviarse</AlertTitle><AlertDescription>{estado.aviso}</AlertDescription></Alert>}
    {estado.errores?.serviciosIds?.[0] && <p role="alert">{estado.errores.serviciosIds[0]}</p>}
    {servicios.map((s) => <label key={s.id} className="flex gap-3 rounded-md border p-3"><input type="checkbox" checked={seleccionados.has(s.id)} onChange={(e) => setSeleccionados((prev) => { const next = new Set(prev); e.currentTarget.checked ? next.add(s.id) : next.delete(s.id); return next; })} /><span className="flex-1">{s.nombre}</span><span>{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(s.precio))}</span></label>)}
    <nav aria-label="Páginas del catálogo" className="flex items-center gap-3"><Button type="button" variant="outline" disabled={pagina <= 1 || cargando} onClick={() => ir(pagina - 1)}>Servicios anteriores</Button><span aria-live="polite">Página {pagina} de {totalPaginas}</span><Button type="button" variant="outline" disabled={pagina >= totalPaginas || cargando} onClick={() => ir(pagina + 1)}>Más servicios</Button></nav>
    {[...seleccionados].map((id) => <input key={id} type="hidden" name="serviciosIds" value={id} />)}
    <Button type="submit" disabled={pendiente}>{pendiente ? "Guardando…" : etiqueta}</Button>
  </form>;
}
