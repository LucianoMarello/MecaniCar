/**
 * LOS PERMISOS, PROBADOS CONTRA EL SERVIDOR Y NO CONTRA LA PANTALLA.
 *
 * Casi ninguna de estas pruebas abre una página. Le pegan directo a la API,
 * como alguien con `curl`: la pregunta no es si el botón está escondido, sino
 * si el servidor dice que no cuando alguien se saltea la pantalla.
 *
 * La tabla FILAS es la columna "Rol" de `docs/api.md`, fila por fila, dada
 * vuelta: quién NO puede y qué tiene que contestar el servidor. Los valores
 * esperados salen del contrato, no de correr el código y copiar lo que dio.
 *
 * Los tres números, que no son intercambiables:
 *   401  no sé quién sos                      (sin sesión)
 *   403  sé quién sos, y tu ROL no puede      (el rol equivocado)
 *   404  para vos, esto no existe             (lo de otro cliente)
 *
 * Dos reglas del contrato que cambian lo que se espera:
 *   - Donde dice "Mecánico", también puede el Administrador. Y una fila que
 *     dice solo "Cliente" le responde 403 a los otros dos.
 *   - Lo ajeno responde 404, igual que lo inexistente, para no revelar que
 *     existe.
 */
import { expect, test, type APIRequestContext, type APIResponse } from "@playwright/test";
import { SESION } from "./sesiones";

type Persona = keyof typeof SESION;

const NOMBRE: Record<Persona, string> = {
  cliente: "el cliente",
  otroCliente: "otro cliente",
  mecanico: "el mecánico",
  admin: "el administrador",
};

// Una patente nueva por pedido: es única (RN02) y la base local no se borra.
let patentes = 0;
const nuevaPatente = () =>
  `P${Date.now().toString(36).slice(-6)}${(patentes++).toString(36)}`.toUpperCase();

// Los bodies pasan la validación de `lib/schemas/`: así lo que falla es el
// permiso y no los datos.
const EN_UNA_SEMANA = new Date(Date.now() + 7 * 86_400_000).toISOString();
const vehiculo = () => ({ patente: nuevaPatente(), marca: "Ford", modelo: "Ka" });
const turnoPara = (vehiculoId: string) => ({
  vehiculoId,
  fechaHora: EN_UNA_SEMANA,
  motivo: "Hace ruido al frenar",
});
const SERVICIO = { nombre: "Alineación y balanceo", precio: 30000 };
const SERVICIOS_DEL_PRESUPUESTO = { serviciosIds: ["servicio-demo"] };

// Un id que no es de nadie. El contrato dice que primero se miran la sesión y
// el rol: el 401 y el 403 tienen que salir antes de buscar el recurso. Y si
// hubiera un agujero, el pedido no toca ningún dato.
const NADA = "no-existe";

type Fila = {
  fila: string;
  /** Quiénes tienen sesión y aun así reciben 403. */
  noPueden: Persona[];
  pedir: (api: APIRequestContext) => Promise<APIResponse>;
};

const SOLO_CLIENTE: Persona[] = ["mecanico", "admin"];
const SOLO_TALLER: Persona[] = ["cliente"]; // "Mecánico": también entra el admin
const SOLO_ADMIN: Persona[] = ["cliente", "mecanico"];
const CLIENTE_O_TALLER: Persona[] = []; // ningún rol queda afuera: decide de quién es

const FILAS: Fila[] = [
  // Vehículos
  { fila: "POST /api/vehiculos", noPueden: SOLO_CLIENTE, pedir: (api) => api.post("/api/vehiculos", { data: vehiculo() }) },
  { fila: "GET /api/vehiculos", noPueden: CLIENTE_O_TALLER, pedir: (api) => api.get("/api/vehiculos") },
  { fila: "GET /api/vehiculos/:id", noPueden: CLIENTE_O_TALLER, pedir: (api) => api.get(`/api/vehiculos/${NADA}`) },
  { fila: "PATCH /api/vehiculos/:id", noPueden: CLIENTE_O_TALLER, pedir: (api) => api.patch(`/api/vehiculos/${NADA}`, { data: { marca: "Fiat" } }) },
  { fila: "DELETE /api/vehiculos/:id", noPueden: CLIENTE_O_TALLER, pedir: (api) => api.delete(`/api/vehiculos/${NADA}`) },

  // Turnos
  { fila: "POST /api/turnos", noPueden: SOLO_CLIENTE, pedir: (api) => api.post("/api/turnos", { data: turnoPara(NADA) }) },
  { fila: "GET /api/turnos", noPueden: CLIENTE_O_TALLER, pedir: (api) => api.get("/api/turnos") },
  { fila: "GET /api/turnos/:id", noPueden: CLIENTE_O_TALLER, pedir: (api) => api.get(`/api/turnos/${NADA}`) },
  { fila: "POST /api/turnos/:id/confirmacion", noPueden: SOLO_TALLER, pedir: (api) => api.post(`/api/turnos/${NADA}/confirmacion`) },
  { fila: "POST /api/turnos/:id/cancelacion", noPueden: SOLO_CLIENTE, pedir: (api) => api.post(`/api/turnos/${NADA}/cancelacion`) },

  // Órdenes de trabajo
  { fila: "POST /api/turnos/:id/ingreso", noPueden: SOLO_TALLER, pedir: (api) => api.post(`/api/turnos/${NADA}/ingreso`) },
  { fila: "GET /api/ordenes-trabajo", noPueden: CLIENTE_O_TALLER, pedir: (api) => api.get("/api/ordenes-trabajo") },
  { fila: "GET /api/ordenes-trabajo/:id", noPueden: CLIENTE_O_TALLER, pedir: (api) => api.get(`/api/ordenes-trabajo/${NADA}`) },
  { fila: "POST /api/ordenes-trabajo/:id/finalizacion", noPueden: SOLO_TALLER, pedir: (api) => api.post(`/api/ordenes-trabajo/${NADA}/finalizacion`) },

  // Servicios
  { fila: "POST /api/servicios", noPueden: SOLO_TALLER, pedir: (api) => api.post("/api/servicios", { data: SERVICIO }) },
  { fila: "GET /api/servicios", noPueden: SOLO_TALLER, pedir: (api) => api.get("/api/servicios") },
  { fila: "GET /api/servicios/:id", noPueden: SOLO_TALLER, pedir: (api) => api.get(`/api/servicios/${NADA}`) },
  { fila: "PATCH /api/servicios/:id", noPueden: SOLO_TALLER, pedir: (api) => api.patch(`/api/servicios/${NADA}`, { data: { precio: 1 } }) },
  { fila: "DELETE /api/servicios/:id", noPueden: SOLO_TALLER, pedir: (api) => api.delete(`/api/servicios/${NADA}`) },

  // Presupuestos
  { fila: "POST /api/presupuestos", noPueden: SOLO_TALLER, pedir: (api) => api.post("/api/presupuestos", { data: { ordenTrabajoId: NADA, ...SERVICIOS_DEL_PRESUPUESTO } }) },
  { fila: "PATCH /api/presupuestos/:id", noPueden: SOLO_TALLER, pedir: (api) => api.patch(`/api/presupuestos/${NADA}`, { data: SERVICIOS_DEL_PRESUPUESTO }) },
  { fila: "GET /api/presupuestos", noPueden: CLIENTE_O_TALLER, pedir: (api) => api.get("/api/presupuestos") },
  { fila: "GET /api/presupuestos/:id", noPueden: CLIENTE_O_TALLER, pedir: (api) => api.get(`/api/presupuestos/${NADA}`) },
  { fila: "POST /api/presupuestos/:id/aprobacion", noPueden: SOLO_CLIENTE, pedir: (api) => api.post(`/api/presupuestos/${NADA}/aprobacion`) },
  { fila: "POST /api/presupuestos/:id/rechazo", noPueden: SOLO_CLIENTE, pedir: (api) => api.post(`/api/presupuestos/${NADA}/rechazo`) },

  // Usuarios
  { fila: "GET /api/usuarios", noPueden: SOLO_ADMIN, pedir: (api) => api.get("/api/usuarios") },
  { fila: "PATCH /api/usuarios/:id/rol", noPueden: SOLO_ADMIN, pedir: (api) => api.patch(`/api/usuarios/${NADA}/rol`, { data: { rol: "MECANICO" } }) },
];

// Una "terminal" por persona: cada una con su cookie, sin navegador.
let como: Record<Persona, APIRequestContext>;

test.beforeAll(async ({ playwright }, { project }) => {
  const abrir = (sesion: string) =>
    playwright.request.newContext({ baseURL: project.use.baseURL, storageState: sesion });
  como = {
    cliente: await abrir(SESION.cliente),
    otroCliente: await abrir(SESION.otroCliente),
    mecanico: await abrir(SESION.mecanico),
    admin: await abrir(SESION.admin),
  };
});

test.afterAll(async () => {
  await Promise.all(Object.values(como ?? {}).map((api) => api.dispose()));
});

/** Comprueba que el pedido salió bien y devuelve el cuerpo. */
async function cuerpo<T = { id: string; estado: string }>(respuesta: APIResponse, status = 200) {
  expect(respuesta.status(), await respuesta.text()).toBe(status);
  return (await respuesta.json()) as T;
}

/** Todos los ids de un listado, página por página. */
async function idsDe(api: APIRequestContext, ruta: string) {
  const ids: string[] = [];
  for (let pagina = 1; ; pagina++) {
    const filas = await cuerpo<{ id: string }[]>(await api.get(`${ruta}?pagina=${pagina}&limite=100`));
    ids.push(...filas.map((fila) => fila.id));
    if (filas.length < 100) return ids;
  }
}

test.describe("sin sesión: 401", () => {
  // `request` no lleva cookie: la configuración no pone una sesión por defecto.
  for (const { fila, pedir } of FILAS) {
    test(fila, async ({ request }) => {
      const respuesta = await pedir(request);

      expect(respuesta.status()).toBe(401);
      expect(await respuesta.json()).toEqual({ error: "No autenticado" });
    });
  }
});

test.describe("el rol equivocado: 403", () => {
  for (const { fila, noPueden, pedir } of FILAS) {
    for (const persona of noPueden) {
      test(`${fila}, como ${NOMBRE[persona]}`, async () => {
        const respuesta = await pedir(como[persona]);

        expect(respuesta.status()).toBe(403);
        expect(await respuesta.json()).toEqual({ error: "No autorizado" });
      });
    }
  }

  // La otra mitad de la regla: "Mecánico" no deja afuera al administrador.
  // Con un id que no existe, pasar el control del rol se ve como un 404: no
  // lo frenaron por el rol y no se tocó ningún dato. `POST /api/servicios`
  // queda afuera porque dejaría un servicio nuevo en el catálogo por corrida.
  test("donde dice Mecánico, el administrador también entra", async () => {
    expect((await como.admin.get("/api/servicios")).status()).toBe(200);

    const delTaller = FILAS.filter(
      ({ fila, noPueden }) =>
        noPueden === SOLO_TALLER && !["POST /api/servicios", "GET /api/servicios"].includes(fila),
    );
    expect(delTaller).toHaveLength(8);
    for (const { fila, pedir } of delTaller) {
      expect((await pedir(como.admin)).status(), fila).toBe(404);
    }
  });
});

test.describe("lo ajeno no existe: 404", () => {
  // Lo del seed es todo de cliente@ejemplo.com. Para el otro cliente no está
  // "prohibido": no existe. Un 403 le confirmaría que hay algo con ese id.
  const DEL_SEED = [
    ["GET /api/vehiculos/:id", "/api/vehiculos/vehiculo-demo"],
    ["GET /api/turnos/:id", "/api/turnos/turno-demo"],
    ["GET /api/ordenes-trabajo/:id", "/api/ordenes-trabajo/orden-demo"],
    ["GET /api/presupuestos/:id", "/api/presupuestos/presupuesto-demo"],
  ] as const;

  for (const [fila, ruta] of DEL_SEED) {
    test(`${fila}, de otro cliente`, async () => {
      // El dueño lo ve: el 404 de abajo no es porque el id esté mal escrito.
      expect((await como.cliente.get(ruta)).status()).toBe(200);

      expect((await como.otroCliente.get(ruta)).status()).toBe(404);
    });
  }

  test.describe("con datos de esta corrida", () => {
    // Estas filas cambian datos, así que no usan los del seed: el cliente y el
    // taller arman acá, por la API, lo que el otro cliente va a intentar tocar.
    let suelto = ""; // un vehículo sin turnos
    let conHistorial = ""; // el vehículo de todo lo demás
    let pendiente = ""; // un turno que todavía se puede cancelar
    let ingresado = "";
    let orden = "";
    let presupuesto = "";

    test.beforeAll(async () => {
      const { cliente, mecanico } = como;
      suelto = (await cuerpo(await cliente.post("/api/vehiculos", { data: vehiculo() }), 201)).id;
      conHistorial = (await cuerpo(await cliente.post("/api/vehiculos", { data: vehiculo() }), 201)).id;
      pendiente = (await cuerpo(await cliente.post("/api/turnos", { data: turnoPara(conHistorial) }), 201)).id;
      ingresado = (await cuerpo(await cliente.post("/api/turnos", { data: turnoPara(conHistorial) }), 201)).id;
      await cuerpo(await mecanico.post(`/api/turnos/${ingresado}/confirmacion`));
      orden = (await cuerpo(await mecanico.post(`/api/turnos/${ingresado}/ingreso`), 201)).id;
      presupuesto = (
        await cuerpo(
          await mecanico.post("/api/presupuestos", {
            data: { ordenTrabajoId: orden, ...SERVICIOS_DEL_PRESUPUESTO },
          }),
          201,
        )
      ).id;
    });

    // Después de cada 404 se le pregunta al dueño: el recurso tiene que
    // seguir como estaba. Un 404 que igual escribió sería peor que un 200.

    test("PATCH /api/vehiculos/:id, de otro cliente", async () => {
      const respuesta = await como.otroCliente.patch(`/api/vehiculos/${suelto}`, {
        data: { marca: "Intruso" },
      });
      expect(respuesta.status()).toBe(404);

      const despues = await cuerpo<{ marca: string }>(await como.cliente.get(`/api/vehiculos/${suelto}`));
      expect(despues.marca).toBe("Ford");
    });

    test("DELETE /api/vehiculos/:id, de otro cliente", async () => {
      expect((await como.otroCliente.delete(`/api/vehiculos/${suelto}`)).status()).toBe(404);

      expect((await como.cliente.get(`/api/vehiculos/${suelto}`)).status()).toBe(200);
    });

    test("POST /api/turnos, para el vehículo de otro cliente (RN05)", async () => {
      // Un vehículo propio de esta prueba, que nunca tuvo turnos.
      const { id } = await cuerpo(await como.cliente.post("/api/vehiculos", { data: vehiculo() }), 201);

      const respuesta = await como.otroCliente.post("/api/turnos", { data: turnoPara(id) });
      expect(respuesta.status()).toBe(404);

      // No quedó ningún turno: con uno, el vehículo no se podría dar de baja
      // (RN03) y esto respondería 409.
      expect((await como.cliente.delete(`/api/vehiculos/${id}`)).status()).toBe(204);
    });

    test("POST /api/turnos/:id/cancelacion, de otro cliente", async () => {
      expect((await como.otroCliente.post(`/api/turnos/${pendiente}/cancelacion`)).status()).toBe(404);

      expect((await cuerpo(await como.cliente.get(`/api/turnos/${pendiente}`))).estado).toBe("PENDIENTE");
    });

    for (const decision of ["aprobacion", "rechazo"]) {
      test(`POST /api/presupuestos/:id/${decision}, de otro cliente`, async () => {
        const respuesta = await como.otroCliente.post(`/api/presupuestos/${presupuesto}/${decision}`);
        expect(respuesta.status()).toBe(404);

        // Ni el presupuesto cambió ni la orden pasó a reparación (RN30).
        expect((await cuerpo(await como.cliente.get(`/api/presupuestos/${presupuesto}`))).estado).toBe("PENDIENTE");
        expect((await cuerpo(await como.cliente.get(`/api/ordenes-trabajo/${orden}`))).estado).toBe("ABIERTA");
      });
    }

    // Las cuatro filas de listado: "el cliente recibe solamente lo suyo". Se
    // recorren todas las páginas, para que lo ajeno no quede escondido en la
    // segunda.
    test("los listados del otro cliente no traen nada de esto", async () => {
      const listados = [
        ["/api/vehiculos", "vehiculo-demo", conHistorial],
        ["/api/turnos", "turno-demo", ingresado],
        ["/api/ordenes-trabajo", "orden-demo", orden],
        ["/api/presupuestos", "presupuesto-demo", presupuesto],
      ] as const;

      for (const [ruta, delSeed, recien] of listados) {
        // El dueño sí lo encuentra en el suyo: lo de abajo no pasa de casualidad.
        expect(await idsDe(como.cliente, ruta), ruta).toContain(recien);

        const ajenos = await idsDe(como.otroCliente, ruta);
        expect(ajenos, ruta).not.toContain(delSeed);
        expect(ajenos, ruta).not.toContain(recien);
      }
    });
  });

  test("y la pantalla dice lo mismo que la API", async ({ browser }) => {
    const contexto = await browser.newContext({ storageState: SESION.otroCliente });
    const page = await contexto.newPage();

    await page.goto("/vehiculos/vehiculo-demo");
    await expect(page.getByRole("heading", { name: "No encontramos esta página" })).toBeVisible();

    await contexto.close();
  });
});
