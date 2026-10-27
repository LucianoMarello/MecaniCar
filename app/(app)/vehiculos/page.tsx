import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BuscadorVehiculos } from "@/components/BuscadorVehiculos";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { SinDatos } from "@/components/SinDatos";
import { Button } from "@/components/ui/button";
import { obtenerUsuario } from "@/lib/auth";
import { listarVehiculos } from "@/lib/db/vehiculos";
import { MAX_PAGINAS, paginacionSchema } from "@/lib/schemas/http";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// La pantalla conserva su comprobación de sesión aunque también exista un layout.
export default async function Vehiculos({ searchParams }: Props) {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
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
  // El buscador recibe solo datos de presentación, nunca la sesión.
  const filas = vehiculos.map(({ id, patente, marca, modelo, anio }) => ({
    id,
    patente,
    marca,
    modelo,
    anio,
  }));

  return (
    <main id="contenido" className="min-w-0">
      <EncabezadoPagina
        titulo={
          usuario.rol === "CLIENTE" ? "Mis vehículos" : "Vehículos del taller"
        }
        descripcion={
          usuario.rol === "CLIENTE"
            ? "Consultá los vehículos registrados a tu nombre. Elegí una patente para ver sus datos."
            : "Consultá los vehículos del taller. Elegí una patente para ver sus datos."
        }
      />
      {vehiculos.length === 0 ? (
        <SinDatos
          titulo={
            pagina === 1
              ? "Todavía no hay vehículos"
              : "Llegaste al final del listado"
          }
          descripcion={
            pagina === 1
              ? "Cuando haya vehículos registrados, aparecerán en esta sección. Podés volver a consultarla más adelante."
              : "No hay vehículos en esta página. Usá Página anterior para volver a los resultados."
          }
        />
      ) : (
        <BuscadorVehiculos key={pagina} vehiculos={filas} />
      )}
      <nav
        aria-label="Páginas de vehículos"
        className="mt-8 flex flex-wrap items-center gap-3"
      >
        {pagina > 1 && (
          <Button
            asChild
            variant="outline"
            className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <Link href={`/vehiculos?pagina=${pagina - 1}`}>
              Página anterior
            </Link>
          </Button>
        )}
        <span aria-current="page">Página {pagina}</span>
        {vehiculos.length === limite && pagina < MAX_PAGINAS && (
          <Button
            asChild
            variant="outline"
            className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <Link href={`/vehiculos?pagina=${pagina + 1}`}>
              Página siguiente
            </Link>
          </Button>
        )}
      </nav>
    </main>
  );
}
