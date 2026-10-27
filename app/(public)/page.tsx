import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  if (await obtenerUsuario()) redirect("/vehiculos");
  return (
    <main id="contenido" className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Tu vehículo, más cerca del taller
        </h1>
        <p className="text-muted-foreground">
          Consultá tus vehículos y centralizá la información de la atención del
          taller en MecaniCar.
        </p>
        <Button
          asChild
          className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          <Link href="/ingresar">Ingresar a MecaniCar</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Cómo funciona la atención</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-3 pl-5">
            <li>El cliente registra su vehículo y solicita un turno.</li>
            <li>El taller confirma el turno y recibe el vehículo.</li>
            <li>
              El mecánico prepara un presupuesto y el cliente decide si lo
              aprueba.
            </li>
            <li>El taller realiza la reparación y avisa cuando termina.</li>
          </ol>
        </CardContent>
      </Card>
    </main>
  );
}
