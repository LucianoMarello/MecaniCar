"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { SIN_ENVIAR } from "@/lib/formularios";
import { finalizarOrden } from "./acciones";
export function AccionesOrden({ id, estado }: { id: string; estado: "ABIERTA" | "EN_REPARACION" | "FINALIZADA" }) {
  const [resultado, action, pending] = useActionState(finalizarOrden, SIN_ENVIAR);
  return <section className="mt-6 space-y-3">{estado === "EN_REPARACION" && <form action={action}><input type="hidden" name="id" value={id} /><Button disabled={pending}>{pending ? "Finalizando…" : "Finalizar reparación"}</Button></form>}{resultado.mensaje && <p role="alert" className="text-sm text-destructive">{resultado.mensaje}</p>}</section>;
}
