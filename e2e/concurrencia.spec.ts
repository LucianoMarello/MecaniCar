
import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { SESION } from "./sesiones";

test("diez ingresos simultáneos generan una sola orden de trabajo", async ({
  playwright,
}, testInfo) => {
  const prisma = new PrismaClient();

  const cliente = await playwright.request.newContext({
    baseURL: testInfo.project.use.baseURL,
    storageState: SESION.cliente,
  });

  const mecanico = await playwright.request.newContext({
    baseURL: testInfo.project.use.baseURL,
    storageState: SESION.mecanico,
  });

  try {
    // Cada ejecución utiliza una patente diferente.
    const patente = `C${randomUUID().replace(/-/g, "").slice(0, 7)}`.toUpperCase();

    // 1. Crear un vehículo.
    const respuestaVehiculo = await cliente.post("/api/vehiculos", {
      data: {
        patente,
        marca: "Ford",
        modelo: "Fiesta",
      },
    });

    expect(respuestaVehiculo.status(), await respuestaVehiculo.text()).toBe(201);

    const vehiculo = await respuestaVehiculo.json();

    // 2. Solicitar un turno.
    const respuestaTurno = await cliente.post("/api/turnos", {
      data: {
        vehiculoId: vehiculo.id,
        fechaHora: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        motivo: "Prueba de concurrencia",
      },
    });

    expect(respuestaTurno.status(), await respuestaTurno.text()).toBe(201);

    const turno = await respuestaTurno.json();

    // 3. Confirmar el turno.
    const confirmacion = await mecanico.post(
      `/api/turnos/${turno.id}/confirmacion`,
    );

    expect(confirmacion.status(), await confirmacion.text()).toBe(200);

    // 4. Enviar diez solicitudes sin esperar una por una.
    const respuestas = await Promise.all(
      Array.from({ length: 10 }, () =>
        mecanico.post(`/api/turnos/${turno.id}/ingreso`),
      ),
    );

    const estados = respuestas.map((respuesta) => respuesta.status());

    console.log("Estados HTTP:", estados);

    // 5. Una solicitud debe crear la orden.
    expect(estados.filter((estado) => estado === 201)).toHaveLength(1);

    // Las otras nueve deben recibir un conflicto controlado.
    expect(estados.filter((estado) => estado === 409)).toHaveLength(9);

    // 6. Comprobar la integridad directamente en PostgreSQL.
    const cantidadOrdenes = await prisma.ordenTrabajo.count({
      where: { turnoId: turno.id },
    });

    expect(cantidadOrdenes).toBe(1);
  } finally {
    await Promise.all([
      cliente.dispose(),
      mecanico.dispose(),
      prisma.$disconnect(),
    ]);
  }
});
