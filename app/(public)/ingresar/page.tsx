import { redirect } from "next/navigation";
import { obtenerUsuario, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function iniciarSesion() {
  "use server";
  await signIn("google", { redirectTo: "/vehiculos" });
}

export default async function Ingresar() {
  if (await obtenerUsuario()) redirect("/vehiculos");
  return (
    <main id="contenido" className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-2xl font-bold">Ingresar a MecaniCar</h1>
          </CardTitle>
          <CardDescription>
            Usá tu cuenta de Google para acceder a la información que te
            corresponde.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form action={iniciarSesion}>
            <Button
              type="submit"
              className="min-h-11 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              Continuar con Google
            </Button>
          </form>
          <p className="text-sm text-muted-foreground">
            Si es tu primer ingreso, se crea una cuenta de cliente. El taller
            asigna los permisos de su personal.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
