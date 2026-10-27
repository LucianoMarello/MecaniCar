import { Skeleton } from "@/components/ui/skeleton";

export default function Cargando() {
  return (
    <main
      id="contenido"
      aria-busy="true"
      className="mx-auto max-w-2xl space-y-5 p-6"
    >
      <p role="status">Cargando…</p>
      <div aria-hidden="true" className="space-y-5">
        <Skeleton className="h-9 w-3/4 motion-reduce:animate-none" />
        <Skeleton className="h-6 w-full motion-reduce:animate-none" />
        <Skeleton className="h-40 w-full motion-reduce:animate-none" />
      </div>
    </main>
  );
}
