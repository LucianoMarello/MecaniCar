import { NextResponse } from "next/server";

export function responderError(endpoint: string, error: unknown) {
  console.error(endpoint, error);
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}
