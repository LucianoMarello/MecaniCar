"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function MensajeError({ reintentar }: { reintentar?: () => void }) {
  return (
    <Alert
      variant="destructive"
      className="min-w-0 break-words [overflow-wrap:anywhere]"
    >
      <AlertTitle>No pudimos cargar la información</AlertTitle>
      <AlertDescription>
        <p>
          Ocurrió un problema al consultar los datos. Probá nuevamente en unos
          segundos.
        </p>
        {reintentar ? (
          <Button
            type="button"
            variant="outline"
            onClick={reintentar}
            className="mt-3"
          >
            Reintentar
          </Button>
        ) : (
          <p className="mt-2">
            Ejemplo visual del estado de error; no se ejecuta ninguna consulta.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
