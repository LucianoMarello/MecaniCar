import Link from "next/link";
import { signOut, type UsuarioSesion } from "@/lib/auth";
import { nombreRol } from "@/lib/presentacion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

async function cerrarSesion() {
  "use server";
  await signOut({ redirectTo: "/ingresar" });
}

export function Navegacion({ usuario }: { usuario: UsuarioSesion }) {
  return (
    <header className="bg-card text-card-foreground shadow-sm">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:block focus:p-4 focus:outline-2 focus:outline-foreground"
      >
        Saltar al contenido
      </a>
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-4">
          <Link
            href="/vehiculos"
            className="text-2xl font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
          >
            MecaniCar
          </Link>
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-3">
            <p className="min-w-0 break-words [overflow-wrap:anywhere]">
              {usuario.nombre}
            </p>
            <Badge variant="secondary">{nombreRol[usuario.rol]}</Badge>
            <form action={cerrarSesion}>
              <Button
                type="submit"
                variant="outline"
                className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                Cerrar sesión
              </Button>
            </form>
          </div>
        </div>
        <nav aria-label="Navegación principal" className="flex flex-wrap gap-3">
          <Button
            asChild
            variant="secondary"
            className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <Link href="/vehiculos">
              {usuario.rol === "CLIENTE"
                ? "Mis vehículos"
                : "Vehículos del taller"}
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <Link href="/sistema">Guía visual</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
