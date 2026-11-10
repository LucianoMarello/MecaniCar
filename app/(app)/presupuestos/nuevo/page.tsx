import { notFound, redirect } from "next/navigation";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { obtenerUsuario } from "@/lib/auth";
import { contarServicios, listarServicios } from "@/lib/db/servicios";
import { idSchema } from "@/lib/schemas/http";
import { FormularioServicios } from "../FormularioServicios";
import { crearPresupuestoAction } from "../acciones";

export default async function NuevoPresupuesto({ searchParams }: { searchParams: Promise<{ orden?: string | string[] }> }) {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  if (usuario.rol === "CLIENTE") notFound();
  const query = await searchParams;
  const orden = idSchema.safeParse(query.orden);
  if (!orden.success) notFound();
  const servicios = await listarServicios({ pagina: 1, limite: 100 });
  const totalPaginas = Math.max(1, Math.ceil((await contarServicios()) / 100));
  const action = crearPresupuestoAction.bind(null, orden.data);
  return <main id="contenido" className="max-w-2xl"><EncabezadoPagina titulo="Crear presupuesto" descripcion="Elegí uno o más servicios del catálogo. El precio actual quedará registrado como valor histórico." volver={{ href: `/ordenes-trabajo/${orden.data}`, texto: "Orden de trabajo" }} /><FormularioServicios totalPaginas={totalPaginas} accion={action} etiqueta="Crear presupuesto" servicios={servicios.map((s) => ({ id: s.id, nombre: s.nombre, precio: s.precioActual.toString() }))} /></main>;
}
