"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { Input } from "@/components/ui/input";

type PropsControl = {
  id: string;
  name: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
};

// Conecta etiqueta, control, ayuda y error para que un lector de pantalla lea
// el error. Los ids salen de useId() para no repetirse si hay dos formularios.
export function Campo({
  etiqueta,
  nombre,
  ayuda,
  errores,
  control,
  ...props
}: {
  etiqueta: string;
  nombre: string;
  ayuda?: string;
  errores?: string[];
  // Para un control que no es un input, como un select.
  control?: (props: PropsControl) => ReactNode;
} & Omit<ComponentProps<"input">, "id" | "name">) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const tieneError = Boolean(errores?.length);
  const descripcion =
    [ayuda && idAyuda, tieneError && idError].filter(Boolean).join(" ") ||
    undefined;
  const propsControl: PropsControl = {
    id,
    name: nombre,
    "aria-invalid": tieneError || undefined,
    "aria-describedby": descripcion,
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {etiqueta}
        {props.required && (
          <span className="ml-1 text-muted-foreground" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {control ? control(propsControl) : <Input {...propsControl} {...props} />}
      {ayuda && (
        <p id={idAyuda} className="text-sm text-muted-foreground">
          {ayuda}
        </p>
      )}
      {tieneError && (
        <p id={idError} role="alert" className="text-sm text-destructive">
          {errores![0]}
        </p>
      )}
    </div>
  );
}
