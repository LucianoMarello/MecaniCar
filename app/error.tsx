"use client";

// Next muestra este componente cuando una página falla al armarse.
// Tiene que ser un Client Component porque el botón reintenta en el navegador.
export default function ErrorDePagina({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Algo salió mal</h1>
      <p className="mt-2" role="alert">
        No pudimos mostrar esta página. Probá de nuevo en unos segundos.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 cursor-pointer rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Reintentar
      </button>
    </main>
  );
}
