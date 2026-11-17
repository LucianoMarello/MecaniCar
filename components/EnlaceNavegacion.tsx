"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

// Es de cliente porque tiene que saber en qué página está: la barra vive en el
// layout, que no se vuelve a dibujar en el servidor al navegar.
export function EnlaceNavegacion({ href, children }: { href: string; children: ReactNode }) {
  const ruta = usePathname();
  const actual = ruta === href || ruta.startsWith(`${href}/`);

  return (
    <Button asChild variant={actual ? "secondary" : "ghost"}>
      <Link href={href} aria-current={actual ? "page" : undefined}>
        {children}
      </Link>
    </Button>
  );
}
