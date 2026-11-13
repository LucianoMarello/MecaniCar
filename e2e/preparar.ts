/**
 * Corre una vez antes de todas las pruebas: deja la base lista y arma una
 * sesión por cada persona que las pruebas necesitan.
 *
 * LAS PRUEBAS NO PASAN POR GOOGLE. El login de Google pide una persona, y lo
 * que se quiere probar es MecaniCar, no Google. Al final, lo que hace el login
 * es que Auth.js escriba una cookie cifrada con el AUTH_SECRET. Esto escribe
 * LA MISMA cookie, con la misma función (`encode`, de Auth.js) y el secreto de
 * `.env.e2e`, que en producción no sirve.
 *
 * Lo que NO hay: ningún "modo prueba" en `lib/auth.ts`, ningún usuario mágico,
 * ningún `if (process.env.E2E)`. La app que se prueba es la misma de Vercel.
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Rol, type Usuario } from "@prisma/client";
import { encode } from "next-auth/jwt";
import { prisma } from "../lib/db/client";
import { SESION } from "./sesiones";

/** El nombre de la cookie en http. En https, Auth.js le agrega `__Secure-`. */
const COOKIE = "authjs.session-token";

async function guardarSesion(archivo: string, usuario: Usuario) {
  // El callback `jwt` de `lib/auth.ts` vuelve a buscar al usuario por email en
  // cada pedido: el rol sale de la base, no de esta cookie. Por eso el
  // usuario tiene que existir en la base de prueba.
  const valor = await encode({
    token: {
      sub: usuario.id,
      email: usuario.email,
      name: usuario.nombre,
      usuarioId: usuario.id,
      rol: usuario.rol,
      nombre: usuario.nombre,
    },
    secret: process.env.AUTH_SECRET!,
    salt: COOKIE,
  });

  mkdirSync(path.dirname(archivo), { recursive: true });
  writeFileSync(
    archivo,
    JSON.stringify({
      cookies: [
        {
          name: COOKIE,
          value: valor,
          domain: "localhost",
          path: "/",
          expires: -1,
          httpOnly: true,
          secure: false,
          sameSite: "Lax",
        },
      ],
      origins: [],
    }),
  );
}

export default async function preparar() {
  // La base, al día con las migraciones y con los datos del seed. No se borra
  // entre corridas: cada prueba crea sus propios datos.
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  execSync("npx prisma db seed", { stdio: "inherit" });

  try {
    const buscar = (email: string) => prisma.usuario.findUniqueOrThrow({ where: { email } });
    const cliente = await buscar("cliente@ejemplo.com");
    const mecanico = await buscar("mecanico@ejemplo.com");
    const admin = await buscar(process.env.BOOTSTRAP_ADMIN_EMAIL!);

    // Un segundo cliente, que no está en el seed porque solo lo necesitan las
    // pruebas: es el que intenta ver lo de otro y tiene que recibir 404.
    const otroCliente = await prisma.usuario.upsert({
      where: { email: "otro-cliente@ejemplo.com" },
      update: {},
      create: {
        email: "otro-cliente@ejemplo.com",
        nombre: "Otro",
        apellido: "Cliente",
        rol: Rol.CLIENTE,
      },
    });

    await guardarSesion(SESION.cliente, cliente);
    await guardarSesion(SESION.otroCliente, otroCliente);
    await guardarSesion(SESION.mecanico, mecanico);
    await guardarSesion(SESION.admin, admin);
  } finally {
    await prisma.$disconnect();
  }
}
