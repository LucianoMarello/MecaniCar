import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth";
import { Navegacion } from "@/components/Navegacion";

export default async function LayoutPrivado({
  children,
}: {
  children: ReactNode;
}) {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  // El layout no reemplaza las comprobaciones de sesión y acceso de páginas/modelo.
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navegacion usuario={usuario} />
      <div className="mx-auto w-full min-w-0 max-w-5xl px-4 py-8 sm:px-6">
        {children}
      </div>
      <footer className="mx-auto max-w-5xl px-4 pb-8 text-sm text-muted-foreground sm:px-6">
        MecaniCar · Proyecto MDW 2026 · UAI
      </footer>
    </div>
  );
}
