export async function leerJson(request: Request) {
  try {
    return { exito: true, body: (await request.json()) as unknown } as const;
  } catch {
    return { exito: false } as const;
  }
}

export { idSchema } from "@/lib/schemas/http";
import { paginacionSchema } from "@/lib/schemas/http";
export function leerPaginacion(request: Request) {
  const url = new URL(request.url);
  return paginacionSchema.parse({ pagina: url.searchParams.get("pagina") ?? undefined, limite: url.searchParams.get("limite") ?? undefined });
}
