import { NextResponse } from "next/server";
import { obtenerSesionDemo } from "@/lib/auth-demo";
import {
  buscarPresupuestoParaValidar,
  marcarPresupuestoRechazado,
} from "@/lib/db/presupuestos";
import { validarRechazoPresupuesto } from "@/lib/presupuestos";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Contexto) {
  const { id } = await params;
  const sesion = obtenerSesionDemo();

  // 1. LEER
  const presupuestoActual = await buscarPresupuestoParaValidar(id);
  if (!presupuestoActual) {
    return NextResponse.json(
      { error: "El presupuesto no existe" },
      { status: 404 },
    );
  }

  // Verificar propiedad (Seguridad, no regla de negocio)
  if (presupuestoActual.ordenTrabajo.vehiculo.usuarioId !== sesion.usuarioId) {
    return NextResponse.json(
      { error: "El presupuesto pertenece a otro cliente" },
      { status: 403 },
    );
  }

  // 2. VALIDAR NEGOCIO
  const errores = validarRechazoPresupuesto(presupuestoActual);
  if (errores.length > 0) {
    return NextResponse.json({ error: errores.join(". ") }, { status: 409 });
  }

  // 3. MUTAR
  const presupuestoRechazado = await marcarPresupuestoRechazado(id);
  return NextResponse.json(presupuestoRechazado);
}
