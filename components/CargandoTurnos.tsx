import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CargandoTurnos() {
  return (
    <section
      aria-label="Cargando turnos"
      aria-busy="true"
      className="space-y-6"
    >
      <p role="status" className="sr-only">
        Cargando turnos…
      </p>
      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="h-9 w-1/2 motion-reduce:animate-none" />
        <Skeleton className="h-5 w-full motion-reduce:animate-none" />
        <Skeleton className="h-11 w-full sm:w-40 motion-reduce:animate-none" />
      </div>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((fila) => (
          <Card key={fila}>
            <CardHeader>
              <Skeleton className="h-6 w-48 motion-reduce:animate-none" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-6 w-24 motion-reduce:animate-none" />
              <Skeleton className="h-5 w-3/4 motion-reduce:animate-none" />
              <Skeleton className="h-5 w-full motion-reduce:animate-none" />
              <Skeleton className="h-11 w-28 motion-reduce:animate-none" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
