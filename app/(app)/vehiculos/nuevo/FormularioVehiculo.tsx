"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Campo } from "@/components/Campo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SIN_ENVIAR } from "@/lib/formularios";
import { registrarVehiculo } from "./acciones";

// Es de cliente porque recuerda lo que devolvió la acción y si está guardando.
export function FormularioVehiculo() {
  const [estado, enviar, pendiente] = useActionState(
    registrarVehiculo,
    SIN_ENVIAR,
  );

  return (
    <form action={enviar} noValidate className="space-y-5">
      {estado.mensaje && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo registrar el vehículo</AlertTitle>
          <AlertDescription>
            <p>{estado.mensaje}</p>
          </AlertDescription>
        </Alert>
      )}
      <Campo
        etiqueta="Patente"
        nombre="patente"
        required
        maxLength={16}
        autoComplete="off"
        autoCapitalize="characters"
        defaultValue={estado.valores?.patente}
        errores={estado.errores?.patente}
        ayuda="Solo letras y números, por ejemplo AB123CD o ABC123. Se guarda en mayúsculas, sin espacios ni guiones."
      />
      <Campo
        etiqueta="Marca"
        nombre="marca"
        required
        maxLength={50}
        defaultValue={estado.valores?.marca}
        errores={estado.errores?.marca}
      />
      <Campo
        etiqueta="Modelo"
        nombre="modelo"
        required
        maxLength={50}
        defaultValue={estado.valores?.modelo}
        errores={estado.errores?.modelo}
      />
      <Campo
        etiqueta="Año"
        nombre="anio"
        inputMode="numeric"
        maxLength={4}
        defaultValue={estado.valores?.anio}
        errores={estado.errores?.anio}
        ayuda="Opcional. Si lo dejás vacío, se guarda el año actual."
      />
      {/* En el teléfono, botones apilados y a lo ancho; desde sm:, en fila. */}
      <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse sm:justify-end">
        <Button type="submit" disabled={pendiente} className="w-full sm:w-auto">
          {pendiente ? "Guardando…" : "Registrar vehículo"}
        </Button>
        <Button asChild variant="ghost" className="w-full sm:w-auto">
          <Link href="/vehiculos">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
