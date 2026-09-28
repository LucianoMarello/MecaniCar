import { NextResponse } from "next/server";
import { requerirUsuario } from "@/lib/auth";
import { listarUsuarios } from "@/lib/db/usuarios";
import { responderError } from "@/lib/errores";
export async function GET() { try { await requerirUsuario("ADMIN"); return NextResponse.json(await listarUsuarios()); } catch (error) { return responderError("GET /api/usuarios", error); } }
