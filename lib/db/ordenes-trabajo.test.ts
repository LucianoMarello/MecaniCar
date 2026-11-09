import { beforeEach, describe, expect, it, vi } from "vitest";
import { insertarOrdenDesdeTurno } from "./ordenes-trabajo";
import { ConflictoNegocio } from "@/lib/errores";

// Simula el estado que encuentra la transacción, que puede no ser el que leyó
// el caso de uso si otro pedido escribió en el medio.

vi.mock("@/lib/auth", () => ({
  NoAutenticado: class extends Error {},
  NoAutorizado: class extends Error {},
}));

const db = vi.hoisted(() => {
  const tx = {
    turno: { findUniqueOrThrow: vi.fn() },
    ordenTrabajo: { create: vi.fn() },
  };
  const $transaction = vi.fn<
    (fn: (cliente: typeof tx) => unknown, opciones: unknown) => unknown
  >((fn) => fn(tx));
  return { tx, $transaction };
});

vi.mock("@/lib/db/client", () => ({
  prisma: { $transaction: db.$transaction },
}));

describe("insertarOrdenDesdeTurno", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("si el turno sigue confirmado y sin orden, la crea en una transacción serializable", async () => {
    db.tx.turno.findUniqueOrThrow.mockResolvedValue({
      estado: "CONFIRMADO",
      ordenTrabajo: null,
    });
    db.tx.ordenTrabajo.create.mockResolvedValue({ id: "orden-1" });

    await insertarOrdenDesdeTurno("turno-1", "vehiculo-1");

    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
    expect(db.tx.ordenTrabajo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          turnoId: "turno-1",
          vehiculoId: "vehiculo-1",
          estado: "ABIERTA",
        }),
      }),
    );
  });

  it("si el cliente lo canceló después de leerlo, no crea la orden", async () => {
    db.tx.turno.findUniqueOrThrow.mockResolvedValue({
      estado: "CANCELADO",
      ordenTrabajo: null,
    });

    const intento = insertarOrdenDesdeTurno("turno-1", "vehiculo-1");

    await expect(intento).rejects.toBeInstanceOf(ConflictoNegocio);
    await expect(intento).rejects.toThrow(
      "El turno debe estar CONFIRMADO para registrar el ingreso",
    );
    expect(db.tx.ordenTrabajo.create).not.toHaveBeenCalled();
  });
});
