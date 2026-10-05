import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as finalizarOrden } from "./ordenes-trabajo/[id]/finalizacion/route";
import { POST as crearPresupuesto } from "./presupuestos/route";
import { POST as confirmarTurno } from "./turnos/[id]/confirmacion/route";
import { enviarNotificacion } from "@/lib/servicios/notificaciones";

// Las tres operaciones que avisan por correo (docs/spec.md, sección 9) tienen
// que completarse aunque Resend falle, e informarlo en avisoEnviado.
// Se simulan la sesión, la base y Resend; las reglas de negocio son las reales.

vi.mock("@/lib/auth", () => ({
  NoAutenticado: class extends Error {},
  NoAutorizado: class extends Error {},
  requerirUsuario: vi.fn(async () => ({
    id: "mecanico-1",
    email: "mecanico@example.com",
    nombre: "Mecánico",
    rol: "MECANICO",
  })),
}));

vi.mock("@/lib/servicios/notificaciones", () => ({
  enviarNotificacion: vi.fn(),
}));

const cliente = { usuario: { email: "cliente@example.com" } };

vi.mock("@/lib/db/turnos", () => ({
  buscarTurnoParaValidarConfirmacion: vi.fn(async () => ({
    estado: "PENDIENTE",
    ...cliente,
  })),
  marcarTurnoConfirmado: vi.fn(async (id: string) => ({
    id,
    estado: "CONFIRMADO",
  })),
}));

vi.mock("@/lib/db/presupuestos", () => ({
  listarPresupuestos: vi.fn(),
  buscarOrdenYServiciosParaPresupuesto: vi.fn(async () => ({
    orden: { estado: "ABIERTA", turno: cliente },
    servicios: [{ id: "servicio-1", precioActual: 50000 }],
    idsUnicos: ["servicio-1"],
  })),
  insertarPresupuesto: vi.fn(async () => ({
    id: "presupuesto-1",
    estado: "PENDIENTE",
  })),
}));

vi.mock("@/lib/db/ordenes-trabajo", () => ({
  buscarOrdenParaValidar: vi.fn(async () => ({
    estado: "EN_REPARACION",
    presupuestos: [{ estado: "APROBADO" }],
    turno: cliente,
  })),
  marcarOrdenFinalizada: vi.fn(async (id: string) => ({
    id,
    estado: "FINALIZADA",
  })),
}));

const contexto = (id: string) => ({ params: Promise.resolve({ id }) });

const operaciones = [
  {
    nombre: "confirmar un turno",
    status: 200,
    estado: "CONFIRMADO",
    ejecutar: () =>
      confirmarTurno(
        new Request("http://test/api/turnos/turno-1/confirmacion", {
          method: "POST",
        }),
        contexto("turno-1"),
      ),
  },
  {
    nombre: "crear un presupuesto",
    status: 201,
    estado: "PENDIENTE",
    ejecutar: () =>
      crearPresupuesto(
        new Request("http://test/api/presupuestos", {
          method: "POST",
          body: JSON.stringify({
            ordenTrabajoId: "orden-1",
            serviciosIds: ["servicio-1"],
          }),
        }),
      ),
  },
  {
    nombre: "finalizar una orden",
    status: 200,
    estado: "FINALIZADA",
    ejecutar: () =>
      finalizarOrden(
        new Request("http://test/api/ordenes-trabajo/orden-1/finalizacion", {
          method: "POST",
        }),
        contexto("orden-1"),
      ),
  },
];

describe("avisoEnviado en las operaciones que avisan por correo", () => {
  beforeEach(() => {
    vi.mocked(enviarNotificacion).mockReset();
  });

  it.each(operaciones)(
    "$nombre: si el correo sale, responde avisoEnviado true",
    async ({ ejecutar, status, estado }) => {
      vi.mocked(enviarNotificacion).mockResolvedValue(true);

      const respuesta = await ejecutar();

      expect(respuesta.status).toBe(status);
      expect(await respuesta.json()).toMatchObject({
        estado,
        avisoEnviado: true,
      });
    },
  );

  it.each(operaciones)(
    "$nombre: si Resend falla, la operación se completa igual y responde avisoEnviado false",
    async ({ ejecutar, status, estado }) => {
      vi.mocked(enviarNotificacion).mockResolvedValue(false);

      const respuesta = await ejecutar();

      expect(respuesta.status).toBe(status);
      expect(await respuesta.json()).toMatchObject({
        estado,
        avisoEnviado: false,
      });
    },
  );
});
