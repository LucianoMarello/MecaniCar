import type { Rol } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import type { ActualizarVehiculoInput, VehiculoInput } from "@/lib/schemas/vehiculo";

const vehiculoSelect = { id: true, patente: true, marca: true, modelo: true, anio: true, usuarioId: true, createdAt: true, updatedAt: true } as const;

export function listarVehiculos(usuarioId: string, rol: Rol) {
  return prisma.vehiculo.findMany({ where: rol === "CLIENTE" ? { usuarioId } : undefined, select: vehiculoSelect, orderBy: { patente: "asc" }, take: 100 });
}

export async function buscarVehiculo(id: string, usuarioId: string, rol: Rol) {
  const vehiculo = await prisma.vehiculo.findUnique({ where: { id }, select: vehiculoSelect });
  if (!vehiculo) return { resultado: "NO_EXISTE" } as const;
  if (rol === "CLIENTE" && vehiculo.usuarioId !== usuarioId) return { resultado: "PROHIBIDO" } as const;
  return { resultado: "OK", vehiculo } as const;
}

export async function crearVehiculo(datos: VehiculoInput, usuarioId: string) {
  const duplicado = await prisma.vehiculo.findUnique({ where: { patente: datos.patente }, select: { id: true } });
  if (duplicado) return { resultado: "PATENTE_DUPLICADA" } as const;
  const vehiculo = await prisma.vehiculo.create({ data: { ...datos, anio: datos.anio ?? new Date().getFullYear(), usuarioId }, select: vehiculoSelect });
  return { resultado: "CREADO", vehiculo } as const;
}

export async function actualizarVehiculo(id: string, datos: ActualizarVehiculoInput, usuarioId: string, rol: Rol) {
  const acceso = await buscarVehiculo(id, usuarioId, rol);
  if (acceso.resultado !== "OK") return acceso;
  if (datos.patente && datos.patente !== acceso.vehiculo.patente) {
    const duplicado = await prisma.vehiculo.findUnique({ where: { patente: datos.patente }, select: { id: true } });
    if (duplicado) return { resultado: "PATENTE_DUPLICADA" } as const;
  }
  const vehiculo = await prisma.vehiculo.update({ where: { id }, data: datos, select: vehiculoSelect });
  return { resultado: "ACTUALIZADO", vehiculo } as const;
}

export async function eliminarVehiculo(id: string, usuarioId: string, rol: Rol) {
  const acceso = await buscarVehiculo(id, usuarioId, rol);
  if (acceso.resultado !== "OK") return acceso;
  const dependencias = await prisma.vehiculo.findUnique({ where: { id }, select: { _count: { select: { turnos: true, ordenes: true } } } });
  if (dependencias && (dependencias._count.turnos > 0 || dependencias._count.ordenes > 0)) return { resultado: "EN_USO" } as const;
  await prisma.vehiculo.delete({ where: { id } });
  return { resultado: "ELIMINADO" } as const;
}
