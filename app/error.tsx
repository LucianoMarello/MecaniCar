"use client";

import Link from "next/link";
import { MensajeError } from "@/components/MensajeError";
import { Button } from "@/components/ui/button";

export default function ErrorDePagina({ reset }: { reset: () => void }) {
  return (
    <main id="contenido" className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Algo salió mal</h1>
      <MensajeError reintentar={reset} />
      <Button
        asChild
        variant="outline"
        className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <Link href="/">Volver al inicio</Link>
      </Button>
    </main>
  );
}
