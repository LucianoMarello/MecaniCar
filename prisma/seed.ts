/**
 * Datos de ejemplo para desarrollo.
 *
 * Correr con: npm run db:seed
 *
 * Por qué existe: para que los cuatro integrantes del equipo trabajen contra
 * los mismos datos y para poder mostrar el sistema sin cargar todo a mano.
 * Debe poder correrse varias veces sin romper (por eso usamos upsert).
 */
import { PrismaClient, Rol } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mecanico = await prisma.usuario.upsert({
    where: { email: "mecanico@ejemplo.com" },
    update: {},
    create: {
      email: "mecanico@ejemplo.com",
      nombre: "Mecanico",
      apellido: "Ejemplo",
      rol: Rol.MECANICO,
      telefono: "3411234567",
      direccion: "Rosario, Santa Fe",
    },
  });

  console.log("Seed completo.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
