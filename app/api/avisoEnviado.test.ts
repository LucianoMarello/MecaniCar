import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as finalizarOrden } from "./ordenes-trabajo/[id]/finalizacion/route";
import { PATCH as modificarPresupuesto } from "./presupuestos/[id]/route";
import { POST as crearPresupuesto } from "./presupuestos/route";
import { POST as confirmarTurno } from "./turnos/[id]/confirmacion/route";
import { marcarOrdenFinalizada } from "@/lib/db/ordenes-trabajo";
import {
  buscarDestinatarioPresupuesto,
  editarPresupuesto,
  insertarPresupuesto,
} from "@/lib/db/presupuestos";
import { marcarTurnoConfirmado } from "@/lib/db/turnos";
import { enviarNotificacion } from "@/lib/servicios/notificaciones";

// Las cuatro operaciones que avisan por correo (docs/spec.md, sección 9) tienen
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

const EMAIL_CLIENTE = "cliente@example.com";
const cliente = { usuario: { email: EMAIL_CLIENTE } };

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
  buscarPresupuesto: vi.fn(),
  editarPresupuesto: vi.fn(async (id: string) => ({
    id,
    estado: "PENDIENTE",
    total: "50000.00",
  })),
  buscarDestinatarioPresupuesto: vi.fn(),
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

function pedirEdicion() {
  return modificarPresupuesto(
    new Request("http://test/api/presupuestos/presupuesto-1", {
      method: "PATCH",
      body: JSON.stringify({ serviciosIds: ["servicio-1"] }),
    }),
    contexto("presupuesto-1"),
  );
}

// "guardar" es la escritura en la base de cada operación: el aviso tiene que
// salir después de ella, nunca antes (docs/spec.md, 9.2).
const operaciones = [
  {
    nombre: "confirmar un turno",
    status: 200,
    estado: "CONFIRMADO",
    guardar: marcarTurnoConfirmado,
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
    guardar: insertarPresupuesto,
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
    nombre: "editar un presupuesto",
    status: 200,
    estado: "PENDIENTE",
    guardar: editarPresupuesto,
    ejecutar: pedirEdicion,
  },
  {
    nombre: "finalizar una orden",
    status: 200,
    estado: "FINALIZADA",
    guardar: marcarOrdenFinalizada,
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
    vi.clearAllMocks();
    vi.mocked(buscarDestinatarioPresupuesto).mockResolvedValue(EMAIL_CLIENTE);
    vi.spyOn(console, "error").mockImplementation(() => {});
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

  it.each(operaciones)(
    "$nombre: avisa al cliente, y recién después de guardar",
    async ({ ejecutar, guardar }) => {
      vi.mocked(enviarNotificacion).mockResolvedValue(true);

      await ejecutar();

      expect(enviarNotificacion).toHaveBeenCalledTimes(1);
      expect(enviarNotificacion).toHaveBeenCalledWith(
        expect.objectContaining({ destinatario: EMAIL_CLIENTE }),
      );
      const ordenGuardar = vi.mocked(guardar).mock.invocationCallOrder[0] ?? 0;
      const ordenAviso =
        vi.mocked(enviarNotificacion).mock.invocationCallOrder[0] ?? 0;
      expect(ordenGuardar).toBeGreaterThan(0);
      expect(ordenAviso).toBeGreaterThan(ordenGuardar);
    },
  );

  // Editar es la única que busca el email después de guardar, así que tiene
  // dos formas más de quedarse sin avisar. En las dos la edición ya está hecha.
  it("editar un presupuesto: si falla la consulta del email, responde 200, avisoEnviado false y lo loguea", async () => {
    vi.mocked(buscarDestinatarioPresupuesto).mockRejectedValue(
      new Error("base caída"),
    );

    const respuesta = await pedirEdicion();

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toMatchObject({ avisoEnviado: false });
    expect(enviarNotificacion).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("editar un presupuesto: si no encuentra el email, responde 200, avisoEnviado false y lo loguea", async () => {
    vi.mocked(buscarDestinatarioPresupuesto).mockResolvedValue(undefined);

    const respuesta = await pedirEdicion();

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toMatchObject({ avisoEnviado: false });
    expect(enviarNotificacion).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
