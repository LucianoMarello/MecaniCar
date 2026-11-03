import Link from "next/link";

export function EncabezadoPagina({
  titulo,
  descripcion,
  volver,
}: {
  titulo: string;
  descripcion: string;
  volver?: { href: string; texto: string };
}) {
  return (
    <header className="mb-6 min-w-0 space-y-3">
      <nav
        aria-label="Ubicación actual"
        className="flex flex-wrap gap-x-2 text-sm"
      >
        {volver && (
          <>
            <Link
              href={volver.href}
              className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            >
              {volver.texto}
            </Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span
          aria-current="page"
          className="break-words [overflow-wrap:anywhere]"
        >
          {titulo}
        </span>
      </nav>
      <h1 className="break-words text-3xl font-bold tracking-tight [overflow-wrap:anywhere]">
        {titulo}
      </h1>
      <p className="max-w-prose text-muted-foreground">{descripcion}</p>
    </header>
  );
}
