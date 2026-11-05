"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Campo } from "@/components/Campo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { SIN_ENVIAR } from "@/lib/formularios";
import { solicitarTurno } from "./acciones";

export function FormularioTurno({
  vehiculos,
  vehiculoInicial,
}: {
  vehiculos: { id: string; etiqueta: string }[];
  vehiculoInicial: string;
}) {
  const [estado, enviar, pendiente] = useActionState(
    solicitarTurno,
    SIN_ENVIAR,
  );

  return (
    <form action={enviar} noValidate className="space-y-5">
      {estado.mensaje && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo solicitar el turno</AlertTitle>
          <AlertDescription>
            <p>{estado.mensaje}</p>
          </AlertDescription>
        </Alert>
      )}
      <Campo
        etiqueta="Vehículo"
        nombre="vehiculoId"
        required
        errores={estado.errores?.vehiculoId}
        control={(props) => (
          // Select nativo: en el teléfono abre el selector del sistema.
          <NativeSelect
            {...props}
            required
            defaultValue={estado.valores?.vehiculoId ?? vehiculoInicial}
            className="w-full"
          >
            <NativeSelectOption value="" disabled>
              Elegí un vehículo
            </NativeSelectOption>
            {vehiculos.map(({ id, etiqueta }) => (
              <NativeSelectOption key={id} value={id}>
                {etiqueta}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
      />
      <Campo
        etiqueta="Fecha y hora"
        nombre="fechaHora"
        type="datetime-local"
        required
        defaultValue={estado.valores?.fechaHora}
        errores={estado.errores?.fechaHora}
        ayuda="Horario de Buenos Aires. El taller confirma el turno después."
      />
      <Campo
        etiqueta="Motivo"
        nombre="motivo"
        required
        errores={estado.errores?.motivo}
        ayuda="Contá qué le pasa al vehículo, entre 5 y 500 caracteres."
        control={(props) => (
          <Textarea
            {...props}
            required
            rows={4}
            maxLength={500}
            defaultValue={estado.valores?.motivo}
          />
        )}
      />
      <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse sm:justify-end">
        <Button type="submit" disabled={pendiente} className="w-full sm:w-auto">
          {pendiente ? "Enviando…" : "Solicitar turno"}
        </Button>
        <Button asChild variant="ghost" className="w-full sm:w-auto">
          <Link href="/turnos">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
