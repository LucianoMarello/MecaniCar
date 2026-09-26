/**
 * Datos de ejemplo para desarrollo.
 *
 * Correr con: npm run db:seed
 *
 * Por qué existe: para que los cuatro integrantes del equipo trabajen contra
 * los mismos datos y para poder mostrar el sistema sin cargar todo a mano.
 * Debe poder correrse varias veces sin romper (por eso usamos upsert).
 */
import {
  EstadoOrdenTrabajo,
  EstadoPresupuesto,
  EstadoTurno,
  PrismaClient,
  Rol,
} from "@prisma/client";
import { configuracionAdminInicialSchema } from "../lib/schemas/configuracion-auth";

const prisma = new PrismaClient();

async function asegurarAdministradorInicial() {
  const configuracion = configuracionAdminInicialSchema.parse({ email: process.env.BOOTSTRAP_ADMIN_EMAIL });
  const administradorExistente = await prisma.usuario.findFirst({
    where: { rol: Rol.ADMIN },
    select: { id: true, email: true },
  });

  if (administradorExistente) {
    if (administradorExistente.email !== configuracion.email) {
      const ocupado = await prisma.usuario.findUnique({ where: { email: configuracion.email }, select: { id: true } });
      if (ocupado && ocupado.id !== administradorExistente.id) throw new Error("BOOTSTRAP_ADMIN_EMAIL pertenece a otro usuario existente");
      await prisma.usuario.update({ where: { id: administradorExistente.id }, data: { email: configuracion.email } });
      console.log(`Correo del administrador actualizado: ${configuracion.email}`);
      return;
    }
    console.log(
      `Administrador inicial ya configurado: ${administradorExistente.email}`,
    );
    return;
  }

  const usuarioConMismoEmail = await prisma.usuario.findUnique({
    where: { email: configuracion.email },
    select: { id: true },
  });

  if (usuarioConMismoEmail) {
    throw new Error(
      "BOOTSTRAP_ADMIN_EMAIL pertenece a un usuario existente que no es ADMIN",
    );
  }

  await prisma.usuario.create({
    data: {
      email: configuracion.email,
      nombre: "Administrador",
      apellido: "Inicial",
      rol: Rol.ADMIN,
    },
  });

  console.log("Administrador inicial creado.");
}

async function main() {
  await asegurarAdministradorInicial();

  await prisma.usuario.upsert({
    where: { email: "mecanico@ejemplo.com" },
    update: {
      nombre: "Mecánico",
      apellido: "Ejemplo",
      rol: Rol.MECANICO,
    },
    create: {
      id: "usuario-mecanico-demo",
      email: "mecanico@ejemplo.com",
      nombre: "Mecánico",
      apellido: "Ejemplo",
      rol: Rol.MECANICO,
      telefono: "3411234567",
      direccion: "Rosario, Santa Fe",
    },
  });

  await prisma.usuario.upsert({
    where: { email: "cliente@ejemplo.com" },
    update: {
      nombre: "Cliente",
      apellido: "Ejemplo",
      rol: Rol.CLIENTE,
    },
    create: {
      id: "usuario-cliente-demo",
      email: "cliente@ejemplo.com",
      nombre: "Cliente",
      apellido: "Ejemplo",
      rol: Rol.CLIENTE,
      telefono: "3417654321",
      direccion: "Rosario, Santa Fe",
    },
  });

  await prisma.vehiculo.upsert({
    where: { patente: "API123" },
    update: {
      usuarioId: "usuario-cliente-demo",
      marca: "Ford",
      modelo: "Focus",
      anio: 2020,
    },
    create: {
      id: "vehiculo-demo",
      patente: "API123",
      marca: "Ford",
      modelo: "Focus",
      anio: 2020,
      usuarioId: "usuario-cliente-demo",
    },
  });

  await prisma.turno.upsert({
    where: { id: "turno-demo" },
    update: {
      estado: EstadoTurno.CONFIRMADO,
      fechaHora: new Date("2027-12-15T13:00:00.000Z"),
    },
    create: {
      id: "turno-demo",
      usuarioId: "usuario-cliente-demo",
      vehiculoId: "vehiculo-demo",
      fechaHora: new Date("2027-12-15T13:00:00.000Z"),
      motivo: "Revisión general del vehículo",
      estado: EstadoTurno.CONFIRMADO,
    },
  });

  await prisma.ordenTrabajo.upsert({
    where: { turnoId: "turno-demo" },
    update: { estado: EstadoOrdenTrabajo.ABIERTA },
    create: {
      id: "orden-demo",
      turnoId: "turno-demo",
      vehiculoId: "vehiculo-demo",
      fechaIngreso: new Date(),
      estado: EstadoOrdenTrabajo.ABIERTA,
    },
  });

  await prisma.servicio.upsert({
    where: { id: "servicio-demo" },
    update: {
      nombre: "Cambio de aceite",
      descripcion: "Cambio de aceite y control general",
      precioActual: 50000,
    },
    create: {
      id: "servicio-demo",
      nombre: "Cambio de aceite",
      descripcion: "Cambio de aceite y control general",
      precioActual: 50000,
    },
  });

  await prisma.presupuesto.upsert({
    where: { id: "presupuesto-demo" },
    update: { estado: EstadoPresupuesto.PENDIENTE },
    create: {
      id: "presupuesto-demo",
      ordenTrabajoId: "orden-demo",
      estado: EstadoPresupuesto.PENDIENTE,
    },
  });

  await prisma.detallePresupuesto.upsert({
    where: {
      presupuestoId_servicioId: {
        presupuestoId: "presupuesto-demo",
        servicioId: "servicio-demo",
      },
    },
    update: { precioAplicado: 50000 },
    create: {
      id: "detalle-demo",
      presupuestoId: "presupuesto-demo",
      servicioId: "servicio-demo",
      precioAplicado: 50000,
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
