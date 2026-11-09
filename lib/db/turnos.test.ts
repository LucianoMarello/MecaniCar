import { beforeEach, describe, expect, it, vi } from "vitest";
import { marcarTurnoCancelado, marcarTurnoConfirmado } from "./turnos";
import { ConflictoNegocio } from "@/lib/errores";

// Simula el estado que encuentra la transacción, que puede no ser el que leyó
// el caso de uso si otro pedido escribió en el medio.

vi.mock("@/lib/auth", () => ({
  NoAutenticado: class extends Error {},
  NoAutorizado: class extends Error {},
}));

const db = vi.hoisted(() => {
  const tx = { turno: { findUniqueOrThrow: vi.fn(), update: vi.fn() } };
  const $transaction = vi.fn<
    (fn: (cliente: typeof tx) => unknown, opciones: unknown) => unknown
  >((fn) => fn(tx));
  return { tx, $transaction };
});

vi.mock("@/lib/db/client", () => ({
  prisma: { $transaction: db.$transaction },
}));

const SERIALIZABLE = { isolationLevel: "Serializable" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("marcarTurnoConfirmado", () => {
  it("si el turno sigue pendiente, lo confirma en una transacción serializable", async () => {
    db.tx.turno.findUniqueOrThrow.mockResolvedValue({ estado: "PENDIENTE" });
    db.tx.turno.update.mockResolvedValue({ id: "turno-1", estado: "CONFIRMADO" });

    expect(await marcarTurnoConfirmado("turno-1")).toEqual({
      id: "turno-1",
      estado: "CONFIRMADO",
    });
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), SERIALIZABLE);
    expect(db.tx.turno.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "turno-1" }, data: { estado: "CONFIRMADO" } }),
    );
  });

  it("si otro pedido lo canceló después de leerlo, no lo confirma", async () => {
    db.tx.turno.findUniqueOrThrow.mockResolvedValue({ estado: "CANCELADO" });

    const intento = marcarTurnoConfirmado("turno-1");

    await expect(intento).rejects.toBeInstanceOf(ConflictoNegocio);
    await expect(intento).rejects.toThrow("Solo puede confirmarse un turno pendiente");
    expect(db.tx.turno.update).not.toHaveBeenCalled();
  });
});

describe("marcarTurnoCancelado", () => {
  it("si sigue sin orden, lo cancela en una transacción serializable", async () => {
    db.tx.turno.findUniqueOrThrow.mockResolvedValue({
      estado: "CONFIRMADO",
      ordenTrabajo: null,
    });
    db.tx.turno.update.mockResolvedValue({ id: "turno-1", estado: "CANCELADO" });

    await marcarTurnoCancelado("turno-1");

    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), SERIALIZABLE);
    expect(db.tx.turno.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "turno-1" }, data: { estado: "CANCELADO" } }),
    );
  });

  it("si ingresó al taller después de leerlo, no lo cancela", async () => {
    db.tx.turno.findUniqueOrThrow.mockResolvedValue({
      estado: "CONFIRMADO",
      ordenTrabajo: { id: "orden-1" },
    });

    const intento = marcarTurnoCancelado("turno-1");

    await expect(intento).rejects.toBeInstanceOf(ConflictoNegocio);
    await expect(intento).rejects.toThrow(
      "No se puede cancelar un turno que ya ingresó al taller (tiene orden de trabajo)",
    );
    expect(db.tx.turno.update).not.toHaveBeenCalled();
  });
});
