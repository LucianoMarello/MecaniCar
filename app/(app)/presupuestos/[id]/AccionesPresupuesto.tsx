"use client";

import { useActionState, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { SIN_ENVIAR } from "@/lib/formularios";
import { aprobarPresupuestoAction, rechazarPresupuestoAction } from "../acciones";

export function AccionesPresupuesto({ id }: { id: string }) {
  const aprobarAction = aprobarPresupuestoAction.bind(null, id);
  const rechazarAction = rechazarPresupuestoAction.bind(null, id);
  const [errorAprobar, aprobar, aprobando] = useActionState(aprobarAction, SIN_ENVIAR);
  const [errorRechazar, rechazar, rechazando] = useActionState(async (previo: typeof SIN_ENVIAR, _formData: FormData) => {
    const resultado = await rechazarAction(previo);
    if (!resultado.mensaje) setAbierto(false);
    return resultado;
  }, SIN_ENVIAR);
  const [abierto, setAbierto] = useState(false);
  const error = errorAprobar.mensaje ?? errorRechazar.mensaje;
  return <section className="mt-6 space-y-4">{error && <Alert variant="destructive"><AlertTitle>No se pudo responder</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}<div className="flex flex-wrap gap-3"><form action={aprobar}><Button disabled={aprobando || rechazando}>{aprobando ? "Aprobando…" : "Aprobar presupuesto"}</Button></form><AlertDialog open={abierto} onOpenChange={(open: boolean) => { if (!rechazando) setAbierto(open); }}><AlertDialogTrigger asChild><Button variant="outline" disabled={aprobando || rechazando}>Rechazar presupuesto</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Rechazar este presupuesto?</AlertDialogTitle><AlertDialogDescription>El taller tendrá que editarlo antes de que puedas tomar una nueva decisión.</AlertDialogDescription></AlertDialogHeader><form action={rechazar}><AlertDialogFooter><AlertDialogCancel disabled={rechazando}>Volver</AlertDialogCancel><Button type="submit" variant="default" disabled={rechazando}>{rechazando ? "Rechazando…" : "Sí, rechazar presupuesto"}</Button></AlertDialogFooter></form></AlertDialogContent></AlertDialog></div><p role="status" className="sr-only">{aprobando ? "Aprobando presupuesto…" : rechazando ? "Rechazando presupuesto…" : ""}</p></section>;
}
