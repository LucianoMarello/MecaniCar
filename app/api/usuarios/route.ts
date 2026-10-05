import { leerPaginacion } from "@/lib/http";
import { NextResponse } from "next/server";
import { requerirUsuario } from "@/lib/auth";
import { listarUsuarios } from "@/lib/db/usuarios";
import { responderError } from "@/lib/errores";
export async function GET(request: Request) { try { await requerirUsuario("ADMIN"); return NextResponse.json(await listarUsuarios(leerPaginacion(request))); } catch (error) { return responderError("GET /api/usuarios", error); } }
