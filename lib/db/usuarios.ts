import { Prisma, Rol } from "@prisma/client";
import { prisma } from "@/lib/db/client";
const usuarioAuthSelect = { id: true, email: true, nombre: true, apellido: true, rol: true, activo: true } satisfies Prisma.UsuarioSelect;
export function buscarUsuarioParaSesion(email: string) { return prisma.usuario.findUnique({ where: { email }, select: usuarioAuthSelect }); }
export async function obtenerOCrearClienteGoogle(datos: { email: string; nombre: string; imagen?: string | null }) {
  const existente = await prisma.usuario.findUnique({ where: { email: datos.email }, select: usuarioAuthSelect });
  if (existente) return existente;
  try { return await prisma.usuario.create({ data: { ...datos, rol: Rol.CLIENTE }, select: usuarioAuthSelect }); }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return prisma.usuario.findUnique({ where: { email: datos.email }, select: usuarioAuthSelect });
    throw error;
  }
}
export function listarUsuarios() { return prisma.usuario.findMany({ orderBy: [{ rol: "asc" }, { nombre: "asc" }], select: usuarioAuthSelect }); }
export async function cambiarRolUsuario(datos: { usuarioId: string; administradorId: string; rol: "CLIENTE" | "MECANICO" }) {
  if (datos.usuarioId === datos.administradorId) return { resultado: "MISMO_USUARIO" } as const;
  const usuario = await prisma.usuario.findUnique({ where: { id: datos.usuarioId }, select: { id: true } });
  if (!usuario) return { resultado: "NO_EXISTE" } as const;
  const actualizado = await prisma.usuario.update({ where: { id: datos.usuarioId }, data: { rol: datos.rol }, select: usuarioAuthSelect });
  return { resultado: "ACTUALIZADO", usuario: actualizado } as const;
}
