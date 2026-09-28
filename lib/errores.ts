import { NextResponse } from "next/server";
import { NoAutenticado, NoAutorizado } from "@/lib/auth";

export function responderError(endpoint: string, error: unknown) {
  if (error instanceof NoAutenticado) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof NoAutorizado) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  console.error(endpoint, error);
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}
