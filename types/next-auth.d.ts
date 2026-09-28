import type { Rol } from "@prisma/client";
import type { DefaultSession } from "next-auth";
declare module "next-auth" {
  interface Session { user: { id: string; rol: Rol; nombre: string } & DefaultSession["user"]; }
  interface User { rol?: Rol; }
}
declare module "next-auth/jwt" {
  interface JWT { usuarioId?: string; rol?: Rol; nombre?: string; }
}
