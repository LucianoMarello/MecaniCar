import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { EstadoTrabajo } from "@/components/EstadoTrabajo";
import { SinDatos } from "@/components/SinDatos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { obtenerUsuario } from "@/lib/auth";
import { listarTurnos } from "@/lib/db/turnos";
import { formatearFecha } from "@/lib/presentacion";
import { MAX_PAGINAS, paginacionSchema } from "@/lib/schemas/http";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Turnos({ searchParams }: Props) {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  const parametros = await searchParams;
  const validacion = paginacionSchema.safeParse({
    pagina: parametros.pagina,
    limite: 20,
  });
  if (!validacion.success) notFound();
  const { pagina, limite } = validacion.data;
  const esCliente = usuario.rol === "CLIENTE";
  const turnos = await listarTurnos(usuario.id, usuario.rol, validacion.data);

  return (
    <main id="contenido" className="min-w-0">
      <EncabezadoPagina
        titulo={esCliente ? "Mis turnos" : "Turnos del taller"}
        descripcion={
          esCliente
            ? "Consultá los turnos que pediste y en qué estado están."
            : "Consultá los turnos pedidos por los clientes y su estado."
        }
      />
      {esCliente && turnos.length > 0 && (
        <Button asChild className="mb-6 w-full sm:w-auto">
          <Link href="/turnos/nuevo">Solicitar turno</Link>
        </Button>
      )}
      {turnos.length === 0 ? (
        <SinDatos
          titulo={
            pagina === 1 ? "Todavía no hay turnos" : "Llegaste al final del listado"
          }
          descripcion={
            pagina !== 1
              ? "No hay turnos en esta página. Usá Página anterior para volver a los resultados."
              : esCliente
                ? "Cuando pidas un turno para alguno de tus vehículos, lo vas a ver acá."
                : "Cuando un cliente pida un turno, aparecerá en esta sección."
          }
        >
          {esCliente && pagina === 1 && (
            <Button asChild className="w-full sm:w-auto">
              <Link href="/turnos/nuevo">Solicitar mi primer turno</Link>
            </Button>
          )}
        </SinDatos>
      ) : (
        <ul className="grid min-w-0 gap-4 sm:grid-cols-2">
          {turnos.map((turno) => (
            <li key={turno.id} className="min-w-0">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <h2 className="break-words [overflow-wrap:anywhere]">
                      {formatearFecha(turno.fechaHora)}
                    </h2>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <EstadoTrabajo estado={turno.estado} />
                  <p className="break-words [overflow-wrap:anywhere]">
                    {turno.vehiculo.patente} · {turno.vehiculo.marca}{" "}
                    {turno.vehiculo.modelo}
                  </p>
                  <p className="line-clamp-2 break-words text-muted-foreground [overflow-wrap:anywhere]">
                    {turno.motivo}
                  </p>
                  <Button asChild variant="outline">
                    <Link href={`/turnos/${turno.id}`}>
                      Ver turno
                      <span className="sr-only"> del {formatearFecha(turno.fechaHora)}</span>
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-sm text-muted-foreground">
        Horarios expresados en la zona de Buenos Aires.
      </p>
      <nav
        aria-label="Páginas de turnos"
        className="mt-8 flex flex-wrap items-center gap-3"
      >
        {pagina > 1 && (
          <Button asChild variant="outline">
            <Link href={`/turnos?pagina=${pagina - 1}`}>Página anterior</Link>
          </Button>
        )}
        <span aria-current="page">Página {pagina}</span>
        {turnos.length === limite && pagina < MAX_PAGINAS && (
          <Button asChild variant="outline">
            <Link href={`/turnos?pagina=${pagina + 1}`}>Página siguiente</Link>
          </Button>
        )}
      </nav>
    </main>
  );
}
