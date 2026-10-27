import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SinDatos } from "@/components/SinDatos";

export default function VehiculoNoEncontrado() {
  return (
    <main id="contenido">
      <h1 className="mb-6 text-3xl font-bold">No encontramos esta página</h1>
      <SinDatos
        titulo="La información solicitada no está disponible"
        descripcion="Revisá la dirección o volvé al listado de vehículos."
      >
        <Button
          asChild
          variant="outline"
          className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          <Link href="/vehiculos">Volver a vehículos</Link>
        </Button>
      </SinDatos>
    </main>
  );
}
