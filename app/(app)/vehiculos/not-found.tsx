import Link from "next/link";

export default function VehiculoNoEncontrado() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">No encontramos esta página</h1>
      <p className="mt-2">
        El vehículo o la página solicitada no están disponibles.
      </p>
      <Link
        href="/vehiculos"
        className="mt-4 inline-block underline focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        Volver al listado de vehículos
      </Link>
    </main>
  );
}
