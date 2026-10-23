"use client";

import Link from "next/link";
import { useState } from "react";

type VehiculoFila = {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
};

// Necesita estado y onChange para filtrar lo ya recibido, sin requests por tecla.
export function BuscadorVehiculos({
  vehiculos,
}: {
  vehiculos: VehiculoFila[];
}) {
  const [texto, setTexto] = useState("");
  const termino = texto.trim().toLocaleLowerCase("es-AR");
  const visibles = vehiculos.filter((vehiculo) =>
    `${vehiculo.patente} ${vehiculo.marca} ${vehiculo.modelo}`
      .toLocaleLowerCase("es-AR")
      .includes(termino),
  );

  return (
    <section className="mt-6" aria-label="Listado de vehículos">
      <label htmlFor="buscar-vehiculos" className="block font-medium">
        Buscar por patente, marca o modelo
      </label>
      <input
        id="buscar-vehiculos"
        type="search"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        aria-describedby="alcance-buscador"
        className="mt-2 w-full rounded-md border border-foreground/40 bg-background p-3 focus-visible:outline-2 focus-visible:outline-offset-2"
      />
      <p id="alcance-buscador" className="mt-2 text-sm">
        La búsqueda filtra solamente los vehículos de esta página.
      </p>
      <p role="status" className="mt-3 text-sm">
        {visibles.length} de {vehiculos.length} vehículos en esta página.
      </p>

      {visibles.length === 0 ? (
        <p className="mt-4">No hay coincidencias. Probá con otra búsqueda.</p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {visibles.map((vehiculo) => (
            <li
              key={vehiculo.id}
              className="rounded-md border border-foreground/20 p-4"
            >
              <h2 className="text-lg font-semibold">
                <Link
                  href={`/vehiculos/${vehiculo.id}`}
                  className="underline focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                  {vehiculo.patente}
                </Link>
              </h2>
              <p className="mt-1">
                {vehiculo.marca} {vehiculo.modelo}
              </p>
              <p>Año: {vehiculo.anio}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
