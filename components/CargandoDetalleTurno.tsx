import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CargandoDetalleTurno() {
  return (
    <section
      aria-label="Cargando detalle del turno"
      aria-busy="true"
      className="space-y-6"
    >
      <p role="status" className="sr-only">
        Cargando detalle del turno…
      </p>
      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="h-5 w-32 motion-reduce:animate-none" />
        <Skeleton className="h-9 w-3/4 motion-reduce:animate-none" />
        <Skeleton className="h-5 w-1/2 motion-reduce:animate-none" />
      </div>
      <Card aria-hidden="true">
        <CardContent className="grid gap-6 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((fila) => (
            <div key={fila} className="space-y-2">
              <Skeleton className="h-5 w-24 motion-reduce:animate-none" />
              <Skeleton className="h-6 w-full motion-reduce:animate-none" />
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
