import Link from "next/link";
import { SinDatos } from "@/components/SinDatos";
import { Button } from "@/components/ui/button";

// Mismo texto para un turno inexistente y para uno de otro cliente.
export default function TurnoNoEncontrado() {
  return (
    <main id="contenido">
      <h1 className="mb-6 text-3xl font-bold">No encontramos esta página</h1>
      <SinDatos
        titulo="La información solicitada no está disponible"
        descripcion="Revisá la dirección o volvé al listado de turnos."
      >
        <Button asChild variant="outline">
          <Link href="/turnos">Volver a turnos</Link>
        </Button>
      </SinDatos>
    </main>
  );
}
