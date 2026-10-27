"use client";

import { MensajeError } from "@/components/MensajeError";

export default function ErrorPrivado({ reset }: { reset: () => void }) {
  return (
    <main id="contenido" className="space-y-6">
      <h1 className="text-2xl font-bold">Algo salió mal</h1>
      <MensajeError reintentar={reset} />
    </main>
  );
}
