import type { Rol } from "@prisma/client";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { buscarUsuarioParaSesion, obtenerOCrearClienteGoogle } from "@/lib/db/usuarios";
export class NoAutenticado extends Error { constructor() { super("No autenticado"); this.name = "NoAutenticado"; } }
export class NoAutorizado extends Error { constructor() { super("No autorizado"); this.name = "NoAutorizado"; } }
export type UsuarioSesion = { id: string; email: string; nombre: string; rol: Rol };
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" }, providers: [Google], callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) return false;
      const usuario = await obtenerOCrearClienteGoogle({ email: user.email.toLowerCase(), nombre: user.name?.trim() || "Cliente", imagen: user.image });
      return Boolean(usuario?.activo);
    },
    async jwt({ token, user }) {
      const email = user?.email ?? token.email; if (!email) return token;
      const usuario = await buscarUsuarioParaSesion(email.toLowerCase());
      if (!usuario?.activo) { delete token.usuarioId; delete token.rol; delete token.nombre; return token; }
      token.usuarioId = usuario.id; token.rol = usuario.rol; token.nombre = usuario.nombre; return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.usuarioId === "string" && typeof token.rol === "string") {
        session.user.id = token.usuarioId; session.user.rol = token.rol as Rol;
        session.user.nombre = typeof token.nombre === "string" ? token.nombre : session.user.name ?? "";
      }
      return session;
    },
  },
});
export async function obtenerUsuario(): Promise<UsuarioSesion | null> {
  const usuario = (await auth())?.user; if (!usuario?.id || !usuario.email || !usuario.rol) return null;
  return { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol };
}
export async function requerirUsuario(rol?: Rol): Promise<UsuarioSesion> {
  const usuario = await obtenerUsuario(); if (!usuario) throw new NoAutenticado();
  if (rol && usuario.rol !== rol && !(rol === "MECANICO" && usuario.rol === "ADMIN")) throw new NoAutorizado();
  return usuario;
}
