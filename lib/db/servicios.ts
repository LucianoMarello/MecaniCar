import type {
  ActualizarServicioInput,
  ServicioInput,
} from "@/lib/schemas/servicio";
import { prisma } from "@/lib/db/client";

const servicioSelect = {
  id: true,
  nombre: true,
  descripcion: true,
  precioActual: true,
  createdAt: true,
  updatedAt: true,
} as const;

export function listarServicios() {
  return prisma.servicio.findMany({
    select: servicioSelect,
    orderBy: { nombre: "asc" },
    take: 100,
  });
}

export function buscarServicioPorId(id: string) {
  return prisma.servicio.findUnique({
    where: { id },
    select: servicioSelect,
  });
}

export function crearServicio(datos: ServicioInput) {
  return prisma.servicio.create({
    data: {
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      precioActual: datos.precio,
    },
    select: servicioSelect,
  });
}

export async function actualizarServicio(
  id: string,
  datos: ActualizarServicioInput,
) {
  const existente = await prisma.servicio.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existente) return null;

  return prisma.servicio.update({
    where: { id },
    data: {
      ...(datos.nombre !== undefined && { nombre: datos.nombre }),
      ...(datos.descripcion !== undefined && {
        descripcion: datos.descripcion,
      }),
      ...(datos.precio !== undefined && { precioActual: datos.precio }),
    },
    select: servicioSelect,
  });
}

export async function eliminarServicio(id: string) {
  const existente = await prisma.servicio.findUnique({
    where: { id },
    select: {
      id: true,
      _count: { select: { detalles: true } },
    },
  });

  if (!existente) return "NO_EXISTE" as const;
  if (existente._count.detalles > 0) return "EN_USO" as const;

  await prisma.servicio.delete({ where: { id } });
  return "ELIMINADO" as const;
}
