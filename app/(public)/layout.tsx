import Link from "next/link";
import type { ReactNode } from "react";

export default function LayoutPublico({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:block focus:p-4 focus:outline-2 focus:outline-foreground"
      >
        Saltar al contenido
      </a>
      <header className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Link
          href="/"
          className="text-2xl font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
        >
          MecaniCar
        </Link>
      </header>
      <div className="mx-auto w-full min-w-0 max-w-5xl px-4 py-6 sm:px-6">
        {children}
      </div>
      <footer className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted-foreground sm:px-6">
        Proyecto MDW 2026 · UAI · Luciano Marello, Pedro Cabral y Mauro
        Gobernatori.
      </footer>
    </div>
  );
}
