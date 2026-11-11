"use client";

import { useActionState, useState, useTransition } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatearImporte } from "@/lib/presentacion";
import { SIN_ENVIAR, type EstadoFormulario } from "@/lib/formularios";
import { actualizarSeleccionServicios } from "@/lib/seleccionServicios";
import { cargarServiciosAction } from "./acciones";

type ServicioForm = {
  id: string;
  nombre: string;
  precio: string;
  seleccionado?: boolean;
};

type Props = {
  servicios: ServicioForm[];
  totalPaginas: number;
  accion: (
    previo: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  etiqueta: string;
  preciosHistoricos?: Record<string, string>;
};

export function FormularioServicios({
  servicios: iniciales,
  totalPaginas: paginasIniciales,
  accion,
  etiqueta,
  preciosHistoricos = {},
}: Props) {
  const [estado, enviar, pendiente] = useActionState(accion, SIN_ENVIAR);
  const [servicios, setServicios] = useState(iniciales);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(paginasIniciales);
  const [seleccionados, setSeleccionados] = useState(
    () =>
      new Set(
        iniciales
          .filter((servicio) => servicio.seleccionado)
          .map((servicio) => servicio.id)
          .concat(Object.keys(preciosHistoricos)),
      ),
  );
  const [cargando, iniciar] = useTransition();

  function ir(destino: number) {
    iniciar(async () => {
      const resultado = await cargarServiciosAction(destino);
      if (resultado.resultado === "OK") {
        setServicios(resultado.servicios);
        setPagina(resultado.pagina);
        setTotalPaginas(resultado.totalPaginas);
      }
    });
  }

  return (
    <form action={enviar} className="space-y-4">
      {estado.mensaje && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>{estado.mensaje}</AlertDescription>
        </Alert>
      )}
      {estado.aviso && (
        <Alert variant="destructive">
          <AlertTitle>
            El presupuesto se guardó, pero el aviso no pudo enviarse
          </AlertTitle>
          <AlertDescription>{estado.aviso}</AlertDescription>
        </Alert>
      )}
      {estado.errores?.serviciosIds?.[0] && (
        <p role="alert">{estado.errores.serviciosIds[0]}</p>
      )}
      <ul className="space-y-2">
        {servicios.map((servicio) => (
          <li key={servicio.id}>
            <label className="flex gap-3 rounded-md border p-3">
              <input
                type="checkbox"
                checked={seleccionados.has(servicio.id)}
                onChange={(evento) => {
                  const checked = evento.currentTarget.checked;
                  setSeleccionados((previo) =>
                    actualizarSeleccionServicios(
                      previo,
                      servicio.id,
                      checked,
                    ),
                  );
                }}
              />
              <span className="flex-1">{servicio.nombre}</span>
              <span>
                {formatearImporte(
                  preciosHistoricos[servicio.id] ?? servicio.precio,
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <nav
        aria-label="Páginas del catálogo"
        className="flex items-center gap-3"
      >
        <Button
          type="button"
          variant="outline"
          disabled={pagina <= 1 || cargando}
          onClick={() => ir(pagina - 1)}
        >
          Servicios anteriores
        </Button>
        <span aria-live="polite">
          Página {pagina} de {totalPaginas}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={pagina >= totalPaginas || cargando}
          onClick={() => ir(pagina + 1)}
        >
          Más servicios
        </Button>
      </nav>
      {[...seleccionados].map((id) => (
        <input key={id} type="hidden" name="serviciosIds" value={id} />
      ))}
      <Button type="submit" disabled={pendiente}>
        {pendiente ? "Guardando…" : etiqueta}
      </Button>
    </form>
  );
}
