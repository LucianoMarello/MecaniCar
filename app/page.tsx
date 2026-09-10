/**
 * Home del proyecto.
 *
 * Esto es un Server Component: corre en el servidor, puede leer de la base
 * directamente y nunca llega al navegador. Por eso puede llamar a `listarNotas`
 * sin pasar por un endpoint HTTP.
 *
 * En la clase 1 se reemplaza por la portada del proyecto del equipo.
 */

// Esta página lee datos que cambian, así que se renderiza en cada request.
// Sin esta línea, Next.js intentaría generarla una sola vez durante el build
// —cuando todavía no hay base de datos disponible— y el deploy fallaría.
// En la clase 12 vemos cuándo conviene lo contrario: cachear y revalidar.
export const dynamic = "force-dynamic";

export default async function Home() {
  // La primera vez que se levanta el proyecto todavía no hay base configurada.
  // En vez de reventar con un error de Prisma en la cara, se muestra qué falta.
  // Es el mismo criterio que van a aplicar en todo el sistema: un error
  // esperable no se propaga al usuario, se comunica.

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Proyecto MDW 2026</h1>
      <p className="mt-2 text-sm opacity-70">
        Equipo: completar en el README y acá.
      </p>
      <p className="mt-8 text-sm opacity-70">
        La base está conectada pero no hay datos. Corran <code>npm run db:seed</code>.
      </p>
    </main>
  );
}
