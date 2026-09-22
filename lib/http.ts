export async function leerJson(request: Request) {
  try {
    return { exito: true, body: (await request.json()) as unknown } as const;
  } catch {
    return { exito: false } as const;
  }
}
