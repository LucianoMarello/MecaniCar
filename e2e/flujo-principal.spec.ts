/**
 * EL FLUJO PRINCIPAL, DE PUNTA A PUNTA.
 *
 * Es la sección 11 de la spec ("Criterio de finalización del MVP") recorrida
 * por dos personas, cada una en su navegador: el cliente y el mecánico. Un
 * `test.step` por paso de la spec: si algo se rompe, el reporte dice en cuál.
 *
 * Es una prueba larga y no once cortas a propósito: cada pantalla por separado
 * ya se sabe que abre. Lo que se quiere saber es si lo que hace uno le llega al
 * otro.
 *
 * Los casos de error van en el medio del camino, en el estado real en que
 * aparecen:
 *   - RN06: el cliente pide el turno para una fecha pasada.
 *   - RN10: el cliente intenta cancelar, con la pantalla abierta desde antes,
 *     un turno que el mecánico ya ingresó al taller.
 *   - Spec 9.4: en las pruebas no hay clave de Resend, así que ningún correo
 *     sale y el taller tiene que verlo en la pantalla.
 *
 * Los valores esperados salen de la spec y del contrato (docs/api.md), no de
 * correr el código y copiar lo que dio.
 */
import { expect, test } from "@playwright/test";
import { SESION } from "./sesiones";

// Una patente nueva por corrida: es única (RN02) y la base local no se borra.
const PATENTE = `E2E${Date.now().toString(36).slice(-6).toUpperCase()}`;

// El campo datetime-local no lleva zona: la app lo toma como hora de Buenos
// Aires. Una semana adelante es futuro en cualquier zona.
const EN_UNA_SEMANA = `${new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)}T10:00`;

test.use({ storageState: SESION.cliente });

test("el flujo principal se completa de punta a punta (spec, sección 11)", async ({
  page: cliente,
  browser,
}) => {
  test.slow();
  const contextoMecanico = await browser.newContext({ storageState: SESION.mecanico });
  const mecanico = await contextoMecanico.newPage();
  let turno = "";
  let orden = "";

  await test.step("1. un cliente autenticado registra un vehículo", async () => {
    await cliente.goto("/vehiculos/nuevo");
    await cliente.getByLabel("Patente").fill(PATENTE);
    await cliente.getByLabel("Marca").fill("Ford");
    await cliente.getByLabel("Modelo").fill("Fiesta");
    await cliente.getByRole("button", { name: "Registrar vehículo" }).click();

    await expect(cliente.getByRole("heading", { name: `Vehículo ${PATENTE}` })).toBeVisible();
  });

  await test.step("2. solicita un turno, y no lo consigue para una fecha pasada (RN06)", async () => {
    await cliente.getByRole("link", { name: "Solicitar turno para este vehículo" }).click();
    await cliente.getByLabel("Vehículo").selectOption({ label: `${PATENTE} · Ford Fiesta` });
    await cliente.getByLabel("Fecha y hora").fill("2020-03-02T10:00");
    await cliente.getByLabel("Motivo").fill("Hace ruido al frenar");
    await cliente.getByRole("button", { name: "Solicitar turno" }).click();

    await expect(
      cliente.getByText("La fecha del turno debe ser posterior a la fecha actual"),
    ).toBeVisible();

    await cliente.getByLabel("Fecha y hora").fill(EN_UNA_SEMANA);
    await cliente.getByRole("button", { name: "Solicitar turno" }).click();

    // RN07: todo turno nuevo se crea pendiente.
    await expect(cliente.getByRole("heading", { name: /^Turno del/ })).toBeVisible();
    await expect(cliente.getByText("Pendiente", { exact: true })).toBeVisible();
    turno = cliente.url();
  });

  await test.step("3. un mecánico confirma el turno, y ve que el aviso no salió (9.4)", async () => {
    await mecanico.goto(turno);
    await mecanico.getByRole("button", { name: "Confirmar turno" }).click();

    await expect(
      mecanico.getByText("El turno se confirmó, pero el aviso no pudo enviarse"),
    ).toBeVisible();
    await expect(mecanico.getByText("Confirmado", { exact: true })).toBeVisible();
  });

  await test.step("4. el mecánico registra el ingreso del vehículo", async () => {
    // El cliente abre su turno ahora: ve el turno confirmado y todavía puede
    // cancelarlo. Esta pantalla queda abierta para el paso siguiente.
    await cliente.reload();
    await expect(cliente.getByText("Confirmado", { exact: true })).toBeVisible();

    await mecanico.getByRole("button", { name: "Registrar ingreso" }).click();
    await expect(mecanico.getByRole("heading", { name: `Reparación ${PATENTE}` })).toBeVisible();
    orden = mecanico.url();
  });

  await test.step("5. se crea una orden de trabajo, y el turno ya no se cancela (RN10)", async () => {
    // RN13: una orden nueva se crea abierta.
    await expect(mecanico.getByText("Abierta", { exact: true })).toBeVisible();

    // La pantalla del cliente es de antes del ingreso: el botón sigue ahí,
    // pero el servidor vuelve a mirar la regla. Mensaje de docs/api.md.
    await cliente.getByRole("button", { name: "Cancelar turno" }).click();
    await cliente.getByRole("button", { name: "Sí, cancelar turno" }).click();

    await expect(
      cliente.getByText(
        "No se puede cancelar un turno que ya ingresó al taller (tiene orden de trabajo)",
      ),
    ).toBeVisible();
    await expect(cliente.getByText("Confirmado", { exact: true })).toBeVisible();
  });

  await test.step("6. el mecánico genera un presupuesto con al menos un servicio", async () => {
    await mecanico.getByRole("link", { name: "Crear presupuesto" }).click();
    await mecanico.getByRole("checkbox", { name: /Cambio de aceite/ }).check();
    await mecanico.getByRole("button", { name: "Crear presupuesto" }).click();

    await expect(
      mecanico.getByText("El presupuesto se guardó, pero el aviso no pudo enviarse"),
    ).toBeVisible();
    // RN22: todo presupuesto nuevo se crea pendiente.
    await expect(mecanico.getByText("Pendiente", { exact: true })).toBeVisible();
  });

  await test.step("7. el cliente consulta el presupuesto", async () => {
    await cliente.getByRole("link", { name: "Ver orden de trabajo" }).click();
    await cliente.getByRole("link", { name: "Ver presupuesto" }).click();

    await expect(cliente.getByText("Pendiente", { exact: true })).toBeVisible();
    await expect(cliente.getByText("Cambio de aceite")).toBeVisible();
    // RN25: el total es la suma de los detalles; el único servicio del seed
    // cuesta $ 50.000.
    await expect(cliente.getByText(/^Total: \$\s50\.000,00$/)).toBeVisible();
  });

  await test.step("8. el cliente lo aprueba", async () => {
    await cliente.getByRole("button", { name: "Aprobar presupuesto" }).click();

    await expect(cliente.getByText(/^Presupuesto aprobado/)).toBeVisible();
    await expect(cliente.getByText("Aprobado", { exact: true })).toBeVisible();
  });

  await test.step("9. la orden pasa a reparación (RN30)", async () => {
    await mecanico.goto(orden);

    await expect(mecanico.getByText("En reparación", { exact: true })).toBeVisible();
  });

  await test.step("10. el mecánico finaliza la orden, y ve que el aviso no salió (9.4)", async () => {
    await mecanico.getByRole("button", { name: "Finalizar reparación" }).click();

    await expect(
      mecanico.getByText("La reparación se finalizó, pero el aviso no pudo enviarse"),
    ).toBeVisible();
    await expect(mecanico.getByText("Finalizada", { exact: true })).toBeVisible();
  });

  await test.step("11. el cliente consulta que la reparación está finalizada", async () => {
    await cliente.goto(turno);
    await cliente.getByRole("link", { name: "Ver orden de trabajo" }).click();

    await expect(cliente.getByRole("heading", { name: `Reparación ${PATENTE}` })).toBeVisible();
    await expect(cliente.getByText("Finalizada", { exact: true })).toBeVisible();
  });

  await contextoMecanico.close();
});
