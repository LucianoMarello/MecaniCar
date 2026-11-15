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
