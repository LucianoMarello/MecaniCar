"use client";

import { CircleCheckIcon } from "lucide-react";
import { useActionState, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { SIN_ENVIAR } from "@/lib/formularios";
import {
  cancelarTurnoAction,
  confirmarTurnoAction,
  registrarIngresoAction,
} from "./acciones";

export function AccionesTurno({
  turnoId,
  mostrarConfirmar,
  mostrarCancelar,
  mostrarIngreso,
}: {
  turnoId: string;
  mostrarConfirmar: boolean;
  mostrarCancelar: boolean;
  mostrarIngreso: boolean;
}) {
  // Un estado por acción, todos acá: el mensaje o el aviso siguen a la vista
  // aunque, después de revalidar, el botón que se apretó ya no se muestre.
  // Por eso mismo, un éxito se anuncia en `exito`: el botón desaparece, el
  // foco queda en la página y, sin el mensaje, un lector de pantalla no dice nada.
  const [exito, setExito] = useState("");
  const confirmarEsteTurno = confirmarTurnoAction.bind(null, turnoId);
  const [confirmacion, confirmar, confirmando] = useActionState(async () => {
    const estado = await confirmarEsteTurno();
    // Con aviso no hace falta: su Alert ya dice que el turno se confirmó.
    setExito(estado.mensaje || estado.aviso ? "" : "Turno confirmado.");
    return estado;
  }, SIN_ENVIAR);
  const [ingreso, registrar, registrando] = useActionState(
    registrarIngresoAction.bind(null, turnoId),
    SIN_ENVIAR,
  );
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const cancelarEsteTurno = cancelarTurnoAction.bind(null, turnoId);
  const [cancelacion, cancelar, cancelando] = useActionState(async () => {
    const estado = await cancelarEsteTurno();
    // El diálogo se cierra con la respuesta: si hubo rechazo, el mensaje
    // queda arriba de los botones y el foco vuelve a "Cancelar turno".
    setDialogoAbierto(false);
    setExito(estado.mensaje ? "" : "Turno cancelado.");
    return estado;
  }, SIN_ENVIAR);

  const rechazos = [
    { titulo: "No se pudo confirmar el turno", mensaje: confirmacion.mensaje },
    { titulo: "No se pudo cancelar el turno", mensaje: cancelacion.mensaje },
    { titulo: "No se pudo registrar el ingreso", mensaje: ingreso.mensaje },
  ].filter((rechazo) => rechazo.mensaje);
  const hayBotones = mostrarConfirmar || mostrarCancelar || mostrarIngreso;
  if (!hayBotones && !exito && !confirmacion.aviso && rechazos.length === 0) {
    return null;
  }

  return (
    <section aria-label="Acciones del turno" className="mt-6 space-y-4">
      {/* La región role="status" existe desde el principio, vacía y fuera de
          la vista: si apareciera junto con el texto, algunos lectores de
          pantalla no lo anunciarían. */}
      <p
        role="status"
        className={exito ? "flex items-center gap-2 text-sm font-medium" : "sr-only"}
      >
        {exito && <CircleCheckIcon aria-hidden="true" className="size-4 shrink-0" />}
        {exito}
      </p>
      {confirmacion.aviso && (
        <Alert variant="destructive">
          <AlertTitle>El turno se confirmó, pero el aviso no pudo enviarse</AlertTitle>
          <AlertDescription>{confirmacion.aviso}</AlertDescription>
        </Alert>
      )}
      {rechazos.map(({ titulo, mensaje }) => (
        <Alert key={titulo} variant="destructive">
          <AlertTitle>{titulo}</AlertTitle>
          <AlertDescription>{mensaje}</AlertDescription>
        </Alert>
      ))}
      {hayBotones && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {mostrarConfirmar && (
            <form action={confirmar}>
              <Button
                type="submit"
                disabled={confirmando}
                className="w-full sm:w-auto"
              >
                {confirmando ? "Confirmando…" : "Confirmar turno"}
              </Button>
            </form>
          )}
          {mostrarIngreso && (
            <form action={registrar}>
              <Button
                type="submit"
                disabled={registrando}
                className="w-full sm:w-auto"
              >
                {registrando ? "Registrando ingreso…" : "Registrar ingreso"}
              </Button>
            </form>
          )}
          {mostrarCancelar && (
            <AlertDialog
              open={dialogoAbierto}
              onOpenChange={(abrir) => {
                // Mientras cancela, ni Esc ni "Volver" lo cierran.
                if (!cancelando) setDialogoAbierto(abrir);
              }}
            >
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  Cancelar turno
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cancelar este turno?</AlertDialogTitle>
                  <AlertDialogDescription>No se puede deshacer.</AlertDialogDescription>
                </AlertDialogHeader>
                {/* Un botón submit común: AlertDialogAction cerraría el
                    diálogo, y con él el formulario, antes de enviarlo. */}
                <form action={cancelar}>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={cancelando}>Volver</AlertDialogCancel>
                    <Button type="submit" disabled={cancelando}>
                      {cancelando ? "Cancelando…" : "Sí, cancelar turno"}
                    </Button>
                  </AlertDialogFooter>
                </form>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </section>
  );
}
