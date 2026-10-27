"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SinDatos } from "@/components/SinDatos";

type VehiculoFila = {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
};

// Solo este componente necesita recordar la búsqueda y responder al teclado.
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
    <section aria-label="Listado de vehículos" className="min-w-0 space-y-4">
      <div className="space-y-2">
        <label htmlFor="buscar-vehiculos" className="block font-medium">
          Buscar por patente, marca o modelo
        </label>
        <Input
          id="buscar-vehiculos"
          type="search"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          aria-describedby="alcance-buscador"
          className="min-h-11 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        />
        <p id="alcance-buscador" className="text-sm text-muted-foreground">
          La búsqueda filtra solamente los vehículos de esta página.
        </p>
        <p role="status" className="text-sm">
          {visibles.length} de {vehiculos.length} vehículos en esta página.
        </p>
      </div>
      {visibles.length === 0 ? (
        <SinDatos
          titulo="No hay coincidencias"
          descripcion="Hay vehículos en esta página, pero ninguno coincide con tu búsqueda. Probá otro texto o limpiá el campo."
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => setTexto("")}
            className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Limpiar búsqueda
          </Button>
        </SinDatos>
      ) : (
        <ul className="grid min-w-0 gap-4 sm:grid-cols-2">
          {visibles.map((vehiculo) => (
            <li key={vehiculo.id} className="min-w-0">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>
                    <h2 className="break-words [overflow-wrap:anywhere]">
                      {vehiculo.patente}
                    </h2>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="break-words [overflow-wrap:anywhere]">
                    {vehiculo.marca} {vehiculo.modelo}
                  </p>
                  <p className="text-muted-foreground">Año: {vehiculo.anio}</p>
                  <Button
                    asChild
                    variant="outline"
                    className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                  >
                    <Link
                      href={`/vehiculos/${vehiculo.id}`}
                      aria-label={`Ver detalle del vehículo ${vehiculo.patente}`}
                    >
                      Ver detalle
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
