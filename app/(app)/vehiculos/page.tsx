import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BuscadorVehiculos } from "@/components/BuscadorVehiculos";
import { obtenerUsuario } from "@/lib/auth";
import { listarVehiculos } from "@/lib/db/vehiculos";
import { paginacionSchema } from "@/lib/schemas/http";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Server Component: lee la sesión y el modelo directamente, sin llamar a la API.
export default async function Vehiculos({ searchParams }: Props) {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/api/auth/signin?callbackUrl=%2Fvehiculos");

  const parametros = await searchParams;
  const validacion = paginacionSchema.safeParse({
    pagina: parametros.pagina,
    limite: 20,
  });
  if (!validacion.success) notFound();

  const { pagina, limite } = validacion.data;
  const vehiculos = await listarVehiculos(
    usuario.id,
    usuario.rol,
    validacion.data,
  );
  // Solo estos campos de presentación cruzan al componente de cliente.
  const filas = vehiculos.map(({ id, patente, marca, modelo, anio }) => ({
    id,
    patente,
    marca,
    modelo,
    anio,
  }));

  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-8">
      <Link
        href="/"
        className="underline focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        Volver al inicio
      </Link>
      <h1 className="mt-6 text-3xl font-bold">
        {usuario.rol === "CLIENTE" ? "Mis vehículos" : "Vehículos del taller"}
      </h1>
      <p className="mt-2">
        {usuario.rol === "CLIENTE"
          ? "Consultá los vehículos registrados a tu nombre."
          : "Consultá los vehículos registrados en el sistema."}
      </p>

      {vehiculos.length === 0 ? (
        <p className="mt-6" role="status">
          {pagina === 1
            ? "Todavía no hay vehículos para mostrar."
            : "No hay vehículos en esta página. Volvé a la página anterior."}
        </p>
      ) : (
        <BuscadorVehiculos vehiculos={filas} />
      )}

      <nav
        aria-label="Páginas de vehículos"
        className="mt-8 flex flex-wrap items-center gap-5"
      >
        {pagina > 1 && (
          <Link
            href={`/vehiculos?pagina=${pagina - 1}`}
            className="underline focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Página anterior
          </Link>
        )}
        <span>Página {pagina}</span>
        {vehiculos.length === limite && pagina < 100000 && (
          <Link
            href={`/vehiculos?pagina=${pagina + 1}`}
            className="underline focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Página siguiente
          </Link>
        )}
      </nav>
    </main>
  );
}
