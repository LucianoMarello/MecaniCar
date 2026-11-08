import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as cancelar } from "./turnos/[id]/cancelacion/route";
import { POST as confirmar } from "./turnos/[id]/confirmacion/route";
import { POST as ingresar } from "./turnos/[id]/ingreso/route";
import { NoAutenticado, NoAutorizado, requerirUsuario } from "@/lib/auth";
import {
  buscarTurnoParaIngreso,
  insertarOrdenDesdeTurno,
} from "@/lib/db/ordenes-trabajo";
import {
  buscarTurnoParaValidarCancelacion,
  buscarTurnoParaValidarConfirmacion,
  marcarTurnoCancelado,
  marcarTurnoConfirmado,
} from "@/lib/db/turnos";
import { enviarNotificacion } from "@/lib/servicios/notificaciones";

// Fija los status y los cuerpos de confirmar, cancelar y registrar el ingreso
// de un turno, para que la API no cambie cuando se mueva su lógica.
// Se simulan la sesión, la base y Resend; las reglas de negocio son las reales.

vi.mock("@/lib/auth", () => {
  class NoAutenticado extends Error {
    constructor() {
      super("No autenticado");
    }
  }
  class NoAutorizado extends Error {
    constructor() {
      super("No autorizado");
    }
  }
  return { NoAutenticado, NoAutorizado, requerirUsuario: vi.fn() };
});

vi.mock("@/lib/db/turnos", () => ({
  buscarTurnoParaValidarConfirmacion: vi.fn(),
  marcarTurnoConfirmado: vi.fn(),
  buscarTurnoParaValidarCancelacion: vi.fn(),
  marcarTurnoCancelado: vi.fn(),
}));

vi.mock("@/lib/db/ordenes-trabajo", () => ({
  buscarTurnoParaIngreso: vi.fn(),
  insertarOrdenDesdeTurno: vi.fn(),
}));

vi.mock("@/lib/servicios/notificaciones", () => ({
  enviarNotificacion: vi.fn(),
}));

const mecanico = {
  id: "mecanico-1",
  email: "mecanico@example.com",
  nombre: "Mecánico",
  rol: "MECANICO" as const,
};
const cliente = {
  id: "cliente-a",
  email: "cliente@example.com",
  nombre: "Cliente",
  rol: "CLIENTE" as const,
};

const turno = {
  id: "turno-1",
  usuarioId: cliente.id,
  fechaHora: new Date("2026-12-01T13:00:00.000Z"),
  motivo: "Service de los 10.000 km",
  estado: "PENDIENTE" as const,
  fechaCreacion: new Date("2026-11-01T12:00:00.000Z"),
  vehiculo: { id: "vehiculo-1", patente: "AB123CD", marca: "Fiat", modelo: "Cronos" },
  ordenTrabajo: null,
};

const orden = {
  id: "orden-1",
  turnoId: turno.id,
  vehiculoId: turno.vehiculo.id,
  fechaIngreso: new Date("2026-12-01T13:10:00.000Z"),
  estado: "ABIERTA" as const,
  fechaCreacion: new Date("2026-12-01T13:10:00.000Z"),
  vehiculo: { patente: "AB123CD", marca: "Fiat", modelo: "Cronos", usuarioId: cliente.id },
};

// Lo que recibe quien llama a la API: las fechas viajan como texto.
const comoJson = (valor: unknown) => JSON.parse(JSON.stringify(valor));

type Handler = (
  request: Request,
  contexto: { params: Promise<{ id: string }> },
) => Promise<Response>;

function pedir(handler: Handler, id = turno.id) {
  return handler(new Request(`http://test/api/turnos/${id}`, { method: "POST" }), {
    params: Promise.resolve({ id }),
  });
}

const operaciones = [
  {
    nombre: "confirmar",
    handler: confirmar,
    usuario: mecanico,
    buscar: buscarTurnoParaValidarConfirmacion,
  },
  {
    nombre: "cancelar",
    handler: cancelar,
    usuario: cliente,
    buscar: buscarTurnoParaValidarCancelacion,
  },
  {
    nombre: "registrar el ingreso",
    handler: ingresar,
    usuario: mecanico,
    buscar: buscarTurnoParaIngreso,
  },
];

describe("API de turnos: confirmar, cancelar y registrar el ingreso", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe.each(operaciones)("$nombre", ({ handler, usuario, buscar }) => {
    beforeEach(() => {
      vi.mocked(requerirUsuario).mockResolvedValue(usuario);
    });

    it("sin sesión responde 401 y no lee la base", async () => {
      vi.mocked(requerirUsuario).mockRejectedValue(new NoAutenticado());

      const respuesta = await pedir(handler);

      expect(respuesta.status).toBe(401);
      expect(await respuesta.json()).toEqual({ error: "No autenticado" });
      expect(buscar).not.toHaveBeenCalled();
    });

    it(`exige el rol ${usuario.rol} y sin él responde 403 sin leer la base`, async () => {
      vi.mocked(requerirUsuario).mockRejectedValue(new NoAutorizado());

      const respuesta = await pedir(handler);

      expect(requerirUsuario).toHaveBeenCalledWith(usuario.rol);
      expect(respuesta.status).toBe(403);
      expect(await respuesta.json()).toEqual({ error: "No autorizado" });
      expect(buscar).not.toHaveBeenCalled();
    });

    it("con un id inválido responde 400 y no lee la base", async () => {
      const respuesta = await pedir(handler, "no es un id");

      expect(respuesta.status).toBe(400);
      expect(await respuesta.json()).toMatchObject({ error: "Datos inválidos" });
      expect(buscar).not.toHaveBeenCalled();
    });

    it("sin sesión responde 401 aunque el id sea inválido", async () => {
      vi.mocked(requerirUsuario).mockRejectedValue(new NoAutenticado());

      const respuesta = await pedir(handler, "no es un id");

      expect(respuesta.status).toBe(401);
    });

    it("si el turno no existe responde 404", async () => {
      vi.mocked(buscar).mockResolvedValue(null);

      const respuesta = await pedir(handler);

      expect(respuesta.status).toBe(404);
      expect(await respuesta.json()).toEqual({ error: "El turno no existe" });
    });
  });

  describe("confirmar", () => {
    beforeEach(() => {
      vi.mocked(requerirUsuario).mockResolvedValue(mecanico);
    });

    it("si la regla lo rechaza responde 409, sin guardar ni avisar", async () => {
      vi.mocked(buscarTurnoParaValidarConfirmacion).mockResolvedValue({
        estado: "CANCELADO",
        usuario: { email: cliente.email },
      });

      const respuesta = await pedir(confirmar);

      expect(respuesta.status).toBe(409);
      expect(await respuesta.json()).toEqual({
        error: "Solo puede confirmarse un turno pendiente",
      });
      expect(marcarTurnoConfirmado).not.toHaveBeenCalled();
      expect(enviarNotificacion).not.toHaveBeenCalled();
    });

    it("responde 200 con el turno confirmado y avisoEnviado", async () => {
      const confirmado = { ...turno, estado: "CONFIRMADO" as const };
      vi.mocked(buscarTurnoParaValidarConfirmacion).mockResolvedValue({
        estado: "PENDIENTE",
        usuario: { email: cliente.email },
      });
      vi.mocked(marcarTurnoConfirmado).mockResolvedValue(confirmado);
      vi.mocked(enviarNotificacion).mockResolvedValue(false);

      const respuesta = await pedir(confirmar);

      expect(respuesta.status).toBe(200);
      expect(await respuesta.json()).toEqual(
        comoJson({ ...confirmado, avisoEnviado: false }),
      );
    });
  });

  describe("cancelar", () => {
    beforeEach(() => {
      vi.mocked(requerirUsuario).mockResolvedValue(cliente);
    });

    it("busca el turno con el id del cliente de la sesión", async () => {
      vi.mocked(buscarTurnoParaValidarCancelacion).mockResolvedValue(null);

      await pedir(cancelar);

      expect(buscarTurnoParaValidarCancelacion).toHaveBeenCalledWith(
        turno.id,
        cliente.id,
      );
    });

    it("si la regla lo rechaza responde 409 con los motivos unidos por punto", async () => {
      vi.mocked(buscarTurnoParaValidarCancelacion).mockResolvedValue({
        estado: "CANCELADO",
        usuarioId: cliente.id,
        ordenTrabajo: { id: orden.id },
      });

      const respuesta = await pedir(cancelar);

      expect(respuesta.status).toBe(409);
      expect(await respuesta.json()).toEqual({
        error:
          "El turno ya se encuentra cancelado. No se puede cancelar un turno que ya ingresó al taller (tiene orden de trabajo)",
      });
      expect(marcarTurnoCancelado).not.toHaveBeenCalled();
    });

    it("responde 200 con el turno cancelado, sin avisar por correo", async () => {
      const cancelado = { ...turno, estado: "CANCELADO" as const };
      vi.mocked(buscarTurnoParaValidarCancelacion).mockResolvedValue({
        estado: "PENDIENTE",
        usuarioId: cliente.id,
        ordenTrabajo: null,
      });
      vi.mocked(marcarTurnoCancelado).mockResolvedValue(cancelado);

      const respuesta = await pedir(cancelar);

      expect(respuesta.status).toBe(200);
      expect(await respuesta.json()).toEqual(comoJson(cancelado));
      expect(enviarNotificacion).not.toHaveBeenCalled();
    });
  });

  describe("registrar el ingreso", () => {
    beforeEach(() => {
      vi.mocked(requerirUsuario).mockResolvedValue(mecanico);
    });

    it("si la regla lo rechaza responde 409 con los motivos unidos por punto", async () => {
      vi.mocked(buscarTurnoParaIngreso).mockResolvedValue({
        estado: "PENDIENTE",
        vehiculoId: turno.vehiculo.id,
        ordenTrabajo: { id: orden.id },
      });

      const respuesta = await pedir(ingresar);

      expect(respuesta.status).toBe(409);
      expect(await respuesta.json()).toEqual({
        error:
          "El turno debe estar CONFIRMADO para registrar el ingreso. Este turno ya tiene una orden de trabajo asociada",
      });
      expect(insertarOrdenDesdeTurno).not.toHaveBeenCalled();
    });

    it("responde 201 con la orden creada para el vehículo del turno", async () => {
      vi.mocked(buscarTurnoParaIngreso).mockResolvedValue({
        estado: "CONFIRMADO",
        vehiculoId: turno.vehiculo.id,
        ordenTrabajo: null,
      });
      vi.mocked(insertarOrdenDesdeTurno).mockResolvedValue(orden);

      const respuesta = await pedir(ingresar);

      expect(respuesta.status).toBe(201);
      expect(await respuesta.json()).toEqual(comoJson(orden));
      expect(insertarOrdenDesdeTurno).toHaveBeenCalledWith(turno.id, turno.vehiculo.id);
    });

    it("si otro ingreso ganó la carrera, el índice único de la base responde 409", async () => {
      vi.mocked(buscarTurnoParaIngreso).mockResolvedValue({
        estado: "CONFIRMADO",
        vehiculoId: turno.vehiculo.id,
        ordenTrabajo: null,
      });
      vi.mocked(insertarOrdenDesdeTurno).mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
          code: "P2002",
          clientVersion: Prisma.prismaVersion.client,
        }),
      );

      const respuesta = await pedir(ingresar);

      expect(respuesta.status).toBe(409);
      expect(await respuesta.json()).toEqual({
        error: "Conflicto: actualice los datos y vuelva a intentar",
      });
    });
  });
});
