"use client";

import { useActionState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SIN_ENVIAR } from "@/lib/formularios";
import { decidirPresupuestoAction } from "../acciones";

export function AccionesPresupuesto({ id }: { id: string }) {
  const aprobarAction = decidirPresupuestoAction.bind(null, id, "APROBAR");
  const rechazarAction = decidirPresupuestoAction.bind(null, id, "RECHAZAR");
  const [errorAprobar, aprobar, aprobando] = useActionState(aprobarAction, SIN_ENVIAR);
  const [errorRechazar, rechazar, rechazando] = useActionState(rechazarAction, SIN_ENVIAR);
  const error = errorAprobar.mensaje ?? errorRechazar.mensaje;
  return <section className="mt-6 space-y-4">{error && <Alert variant="destructive"><AlertTitle>No se pudo responder</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}<div className="flex flex-wrap gap-3"><form action={aprobar}><Button disabled={aprobando || rechazando}>{aprobando ? "Aprobando…" : "Aprobar presupuesto"}</Button></form><form action={rechazar}><Button variant="outline" disabled={aprobando || rechazando}>{rechazando ? "Rechazando…" : "Rechazar presupuesto"}</Button></form></div></section>;
}
