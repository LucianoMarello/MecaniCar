import { beforeEach, describe, expect, it, vi } from "vitest";
import { cancelarTurno, confirmarTurno, registrarIngreso } from "./turnos";
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

// Se simulan la base y Resend; las reglas de negocio son las reales.

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

const DUENO = "cliente-a";
const EMAIL_DUENO = "cliente@example.com";

const turno = {
  id: "turno-1",
  usuarioId: DUENO,
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
  vehiculo: { patente: "AB123CD", marca: "Fiat", modelo: "Cronos", usuarioId: DUENO },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("confirmarTurno", () => {
  const confirmado = { ...turno, estado: "CONFIRMADO" as const };

  function conTurnoEn(estado: "PENDIENTE" | "CONFIRMADO" | "CANCELADO") {
    vi.mocked(buscarTurnoParaValidarConfirmacion).mockResolvedValue({
      estado,
      usuario: { email: EMAIL_DUENO },
    });
    vi.mocked(marcarTurnoConfirmado).mockResolvedValue(confirmado);
  }

  it("NO_EXISTE si el turno no está, sin guardar ni avisar", async () => {
    vi.mocked(buscarTurnoParaValidarConfirmacion).mockResolvedValue(null);

    expect(await confirmarTurno(turno.id)).toEqual({ resultado: "NO_EXISTE" });
    expect(marcarTurnoConfirmado).not.toHaveBeenCalled();
    expect(enviarNotificacion).not.toHaveBeenCalled();
  });

  it("RECHAZADO con los motivos de la regla, sin guardar ni avisar", async () => {
    conTurnoEn("CANCELADO");

    expect(await confirmarTurno(turno.id)).toEqual({
      resultado: "RECHAZADO",
      motivos: ["Solo puede confirmarse un turno pendiente"],
    });
    expect(marcarTurnoConfirmado).not.toHaveBeenCalled();
    expect(enviarNotificacion).not.toHaveBeenCalled();
  });

  it("CONFIRMADO: guarda y después avisa al cliente del turno", async () => {
    conTurnoEn("PENDIENTE");
    vi.mocked(enviarNotificacion).mockResolvedValue(true);

    expect(await confirmarTurno(turno.id)).toEqual({
      resultado: "CONFIRMADO",
      turno: confirmado,
      avisoEnviado: true,
    });
    expect(marcarTurnoConfirmado).toHaveBeenCalledWith(turno.id);
    expect(enviarNotificacion).toHaveBeenCalledWith({
      destinatario: EMAIL_DUENO,
      asunto: "Turno confirmado - MecaniCar",
      mensaje: `Tu turno ${turno.id} fue confirmado por el taller.`,
    });
    const ordenGuardar = vi.mocked(marcarTurnoConfirmado).mock.invocationCallOrder[0] ?? 0;
    const ordenAviso = vi.mocked(enviarNotificacion).mock.invocationCallOrder[0] ?? 0;
    expect(ordenAviso).toBeGreaterThan(ordenGuardar);
  });

  it("si el correo falla, el turno queda confirmado y avisoEnviado da false", async () => {
    conTurnoEn("PENDIENTE");
    vi.mocked(enviarNotificacion).mockResolvedValue(false);

    expect(await confirmarTurno(turno.id)).toEqual({
      resultado: "CONFIRMADO",
      turno: confirmado,
      avisoEnviado: false,
    });
    expect(marcarTurnoConfirmado).toHaveBeenCalledTimes(1);
  });
});

describe("cancelarTurno", () => {
  const cancelado = { ...turno, estado: "CANCELADO" as const };

  // Como la consulta real: solo encuentra el turno si se busca con su dueño.
  function conTurnoDelDueno(ordenTrabajo: { id: string } | null = null) {
    vi.mocked(buscarTurnoParaValidarCancelacion).mockImplementation(
      async (_id, usuarioId) =>
        usuarioId === DUENO
          ? { estado: "PENDIENTE", usuarioId: DUENO, ordenTrabajo }
          : null,
    );
    vi.mocked(marcarTurnoCancelado).mockResolvedValue(cancelado);
  }

  it("NO_EXISTE si el turno es de otro cliente: busca con el usuarioId recibido", async () => {
    conTurnoDelDueno();

    expect(await cancelarTurno(turno.id, "cliente-b")).toEqual({
      resultado: "NO_EXISTE",
    });
    expect(buscarTurnoParaValidarCancelacion).toHaveBeenCalledWith(
      turno.id,
      "cliente-b",
    );
    expect(marcarTurnoCancelado).not.toHaveBeenCalled();
  });

  it("RECHAZADO si el turno ya ingresó al taller, sin guardar", async () => {
    conTurnoDelDueno({ id: orden.id });

    expect(await cancelarTurno(turno.id, DUENO)).toEqual({
      resultado: "RECHAZADO",
      motivos: [
        "No se puede cancelar un turno que ya ingresó al taller (tiene orden de trabajo)",
      ],
    });
    expect(marcarTurnoCancelado).not.toHaveBeenCalled();
  });

  it("CANCELADO: guarda y no manda correo", async () => {
    conTurnoDelDueno();

    expect(await cancelarTurno(turno.id, DUENO)).toEqual({
      resultado: "CANCELADO",
      turno: cancelado,
    });
    expect(marcarTurnoCancelado).toHaveBeenCalledWith(turno.id);
    expect(enviarNotificacion).not.toHaveBeenCalled();
  });
});

describe("registrarIngreso", () => {
  function conTurnoEn(estado: "PENDIENTE" | "CONFIRMADO" | "CANCELADO") {
    vi.mocked(buscarTurnoParaIngreso).mockResolvedValue({
      estado,
      vehiculoId: turno.vehiculo.id,
      ordenTrabajo: null,
    });
    vi.mocked(insertarOrdenDesdeTurno).mockResolvedValue(orden);
  }

  it("NO_EXISTE si el turno no está, sin crear la orden", async () => {
    vi.mocked(buscarTurnoParaIngreso).mockResolvedValue(null);

    expect(await registrarIngreso(turno.id)).toEqual({ resultado: "NO_EXISTE" });
    expect(insertarOrdenDesdeTurno).not.toHaveBeenCalled();
  });

  it("RECHAZADO si el turno no está confirmado, sin crear la orden", async () => {
    conTurnoEn("CANCELADO");

    expect(await registrarIngreso(turno.id)).toEqual({
      resultado: "RECHAZADO",
      motivos: ["El turno debe estar CONFIRMADO para registrar el ingreso"],
    });
    expect(insertarOrdenDesdeTurno).not.toHaveBeenCalled();
  });

  it("REGISTRADO: crea la orden para el vehículo del turno", async () => {
    conTurnoEn("CONFIRMADO");

    expect(await registrarIngreso(turno.id)).toEqual({
      resultado: "REGISTRADO",
      orden,
    });
    expect(insertarOrdenDesdeTurno).toHaveBeenCalledWith(turno.id, turno.vehiculo.id);
    expect(enviarNotificacion).not.toHaveBeenCalled();
  });

  it("un error de la base no se convierte en resultado: lo traduce quien llama", async () => {
    conTurnoEn("CONFIRMADO");
    vi.mocked(insertarOrdenDesdeTurno).mockRejectedValue(new Error("base caída"));

    await expect(registrarIngreso(turno.id)).rejects.toThrow("base caída");
  });
});
