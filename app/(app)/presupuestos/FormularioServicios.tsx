"use client";

import { useActionState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SIN_ENVIAR, type EstadoFormulario } from "@/lib/formularios";

type ServicioForm = { id: string; nombre: string; precio: string; seleccionado?: boolean };

export function FormularioServicios({
  servicios,
  accion,
  etiqueta,
}: {
  servicios: ServicioForm[];
  accion: (previo: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  etiqueta: string;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, SIN_ENVIAR);
  return <form action={enviar} className="space-y-4">
    {estado.mensaje && <Alert variant="destructive"><AlertTitle>No se pudo guardar</AlertTitle><AlertDescription>{estado.mensaje}</AlertDescription></Alert>}
    {estado.aviso && <Alert variant="destructive"><AlertTitle>El presupuesto se guardó, pero el aviso no pudo enviarse</AlertTitle><AlertDescription>{estado.aviso}</AlertDescription></Alert>}
    {estado.errores?.serviciosIds?.[0] && <p role="alert" className="text-sm text-destructive">{estado.errores.serviciosIds[0]}</p>}
    {servicios.map((servicio) => <label key={servicio.id} className="flex items-start gap-3 rounded-md border p-3"><input type="checkbox" name="serviciosIds" value={servicio.id} defaultChecked={servicio.seleccionado} className="mt-1 size-4 accent-primary" /><span className="flex-1">{servicio.nombre}</span><span>{servicio.precio}</span></label>)}
    <Button type="submit" disabled={pendiente}>{pendiente ? "Guardando…" : etiqueta}</Button>
  </form>;
}
