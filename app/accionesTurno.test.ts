import { Prisma } from "@prisma/client";
import Link from "next/link";
import { createElement, isValidElement } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  obtenerUsuario: vi.fn(),
  confirmarTurno: vi.fn(),
  cancelarTurno: vi.fn(),
  registrarIngreso: vi.fn(),
  buscarTurno: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("@/lib/auth", () => ({ obtenerUsuario: mocks.obtenerUsuario }));
vi.mock("@/lib/casos/turnos", () => ({
  confirmarTurno: mocks.confirmarTurno,
  cancelarTurno: mocks.cancelarTurno,
  registrarIngreso: mocks.registrarIngreso,
}));
vi.mock("@/lib/db/turnos", () => ({ buscarTurno: mocks.buscarTurno }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound,
}));

import {
  cancelarTurnoAction,
  confirmarTurnoAction,
  registrarIngresoAction,
} from "./(app)/turnos/[id]/acciones";
import { AccionesTurno } from "./(app)/turnos/[id]/AccionesTurno";
import DetalleTurno from "./(app)/turnos/[id]/page";
import { ConflictoNegocio } from "@/lib/errores";
import { SIN_ENVIAR, type EstadoFormulario } from "@/lib/formularios";

const cliente = { id: "cliente-a", email: "a@example.com", nombre: "A", rol: "CLIENTE" };
const mecanico = { id: "mecanico-1", email: "m@example.com", nombre: "M", rol: "MECANICO" };
const admin = { id: "admin-1", email: "ad@example.com", nombre: "Ad", rol: "ADMIN" };

const CONFLICTO = "El turno cambió mientras se procesaba. Revisá su estado actual.";

function errorDePrisma(code: string) {
  return new Prisma.PrismaClientKnownRequestError("Falla simulada", {
    code,
    clientVersion: Prisma.prismaVersion.client,
  });
}

// Igual que AccionesTurno: el id se ata con .bind() y useActionState le pasa
// a la acción el estado anterior y el formData.
type AccionDeFormulario = (
  estado: EstadoFormulario,
  datos: FormData,
) => Promise<EstadoFormulario>;

function enviar(
  accion: (turnoId: string) => Promise<EstadoFormulario>,
  turnoId: string,
  campos: Record<string, string> = {},
) {
  const accionDelBoton: AccionDeFormulario = accion.bind(null, turnoId);
  const datos = new FormData();
  for (const [nombre, valor] of Object.entries(campos)) datos.set(nombre, valor);
  return accionDelBoton(SIN_ENVIAR, datos);
}

const acciones = [
  {
    nombre: "confirmar",
    accion: confirmarTurnoAction,
    caso: mocks.confirmarTurno,
    autorizado: mecanico,
    otrosRoles: [cliente],
    mensajeDeRol: "Solo el personal del taller puede confirmar turnos.",
    argumentos: ["turno-1"],
  },
  {
    nombre: "cancelar",
    accion: cancelarTurnoAction,
    caso: mocks.cancelarTurno,
    autorizado: cliente,
    otrosRoles: [mecanico, admin],
    mensajeDeRol: "Solo un cliente puede cancelar sus turnos.",
    argumentos: ["turno-1", "cliente-a"],
  },
  {
    nombre: "registrar el ingreso",
    accion: registrarIngresoAction,
    caso: mocks.registrarIngreso,
    autorizado: mecanico,
    otrosRoles: [cliente],
    mensajeDeRol: "Solo el personal del taller puede registrar el ingreso.",
    argumentos: ["turno-1"],
  },
];

describe.each(acciones)(
  "$nombre desde el detalle del turno",
  ({ accion, caso, autorizado, otrosRoles, mensajeDeRol, argumentos }) => {
    beforeEach(() => {
      vi.clearAllMocks();
      mocks.obtenerUsuario.mockResolvedValue(autorizado);
    });

    it("sin sesión redirige al ingreso y no llama al caso", async () => {
      mocks.obtenerUsuario.mockResolvedValue(null);
      await expect(enviar(accion, "turno-1")).rejects.toThrow("REDIRECT:/ingresar");
      expect(caso).not.toHaveBeenCalled();
    });

    it("con otro rol devuelve un mensaje y no llama al caso", async () => {
      for (const usuario of otrosRoles) {
        mocks.obtenerUsuario.mockResolvedValue(usuario);
        expect(await enviar(accion, "turno-1")).toEqual({ mensaje: mensajeDeRol });
      }
      expect(caso).not.toHaveBeenCalled();
    });

    it("un id inválido da el mismo mensaje que uno inexistente", async () => {
      for (const id of ["../x", "", "a".repeat(101)]) {
        expect(await enviar(accion, id)).toEqual({ mensaje: "El turno no existe." });
      }
      expect(caso).not.toHaveBeenCalled();
    });

    it("usa el id del .bind() e ignora el id y el usuarioId del formData", async () => {
      caso.mockResolvedValue({ resultado: "NO_EXISTE" });
      await enviar(accion, "turno-1", { id: "turno-ajeno", usuarioId: "otro-cliente" });
      expect(caso).toHaveBeenCalledExactlyOnceWith(...argumentos);
    });

    it("NO_EXISTE avisa que el turno no existe y no revalida", async () => {
      caso.mockResolvedValue({ resultado: "NO_EXISTE" });
      expect(await enviar(accion, "turno-1")).toEqual({ mensaje: "El turno no existe." });
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it("RECHAZADO muestra los motivos y revalida, porque la pantalla estaba vieja", async () => {
      caso.mockResolvedValue({ resultado: "RECHAZADO", motivos: ["Motivo uno", "Motivo dos"] });
      expect(await enviar(accion, "turno-1")).toEqual({ mensaje: "Motivo uno. Motivo dos" });
      expect(mocks.revalidatePath.mock.calls).toEqual([["/turnos"], ["/turnos/turno-1"]]);
    });

    it.each([
      ["ConflictoNegocio", new ConflictoNegocio("Solo puede confirmarse un turno pendiente")],
      ["P2034", errorDePrisma("P2034")],
      ["P2002", errorDePrisma("P2002")],
    ])("un %s se informa como conflicto y revalida", async (_nombre, error) => {
      caso.mockRejectedValue(error);
      expect(await enviar(accion, "turno-1")).toEqual({ mensaje: CONFLICTO });
      expect(mocks.revalidatePath.mock.calls).toEqual([["/turnos"], ["/turnos/turno-1"]]);
    });

    it("cualquier otro error se relanza", async () => {
      caso.mockRejectedValue(new Error("Se cayó la base"));
      await expect(enviar(accion, "turno-1")).rejects.toThrow("Se cayó la base");
      caso.mockRejectedValue(errorDePrisma("P2025"));
      await expect(enviar(accion, "turno-1")).rejects.toThrow("Falla simulada");
    });
  },
);

describe("lo propio de cada acción", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("confirmar revalida el listado y el detalle", async () => {
    mocks.obtenerUsuario.mockResolvedValue(mecanico);
    mocks.confirmarTurno.mockResolvedValue({
      resultado: "CONFIRMADO",
      turno: { id: "turno-1" },
      avisoEnviado: true,
    });
    expect(await enviar(confirmarTurnoAction, "turno-1")).toEqual(SIN_ENVIAR);
    expect(mocks.revalidatePath.mock.calls).toEqual([["/turnos"], ["/turnos/turno-1"]]);
  });

  it("si el correo no salió, confirmar devuelve el aviso para el taller", async () => {
    mocks.obtenerUsuario.mockResolvedValue(admin);
    mocks.confirmarTurno.mockResolvedValue({
      resultado: "CONFIRMADO",
      turno: { id: "turno-1" },
      avisoEnviado: false,
    });
    expect(await enviar(confirmarTurnoAction, "turno-1")).toEqual({
      aviso: "Avisale al cliente por otro medio que su turno quedó confirmado.",
    });
    expect(mocks.revalidatePath.mock.calls).toEqual([["/turnos"], ["/turnos/turno-1"]]);
  });

  it("cancelar busca el turno con el cliente de la sesión y revalida", async () => {
    mocks.obtenerUsuario.mockResolvedValue(cliente);
    mocks.cancelarTurno.mockResolvedValue({ resultado: "CANCELADO", turno: { id: "turno-1" } });
    expect(await enviar(cancelarTurnoAction, "turno-1")).toEqual(SIN_ENVIAR);
    expect(mocks.cancelarTurno).toHaveBeenCalledWith("turno-1", "cliente-a");
    expect(mocks.revalidatePath.mock.calls).toEqual([["/turnos"], ["/turnos/turno-1"]]);
  });

  it("registrar el ingreso revalida y lleva a la orden nueva", async () => {
    mocks.obtenerUsuario.mockResolvedValue(admin);
    mocks.registrarIngreso.mockResolvedValue({ resultado: "REGISTRADO", orden: { id: "orden-1" } });
    await expect(enviar(registrarIngresoAction, "turno-1")).rejects.toThrow(
      "REDIRECT:/ordenes-trabajo/orden-1",
    );
    expect(mocks.revalidatePath.mock.calls).toEqual([
      ["/turnos"],
      ["/turnos/turno-1"],
      ["/ordenes-trabajo"],
    ]);
  });
});

// Recorre lo que devuelve la página y junta las props de cada elemento del tipo buscado.
function propsDe(nodo: unknown, tipo: unknown): Record<string, unknown>[] {
  if (Array.isArray(nodo)) return nodo.flatMap((hijo) => propsDe(hijo, tipo));
  if (!isValidElement(nodo)) return [];
  const props = nodo.props as Record<string, unknown>;
  return [...(nodo.type === tipo ? [props] : []), ...propsDe(props.children, tipo)];
}

function turnoCon(estado: string, ordenTrabajo: { id: string } | null) {
  return {
    id: "turno-1",
    usuarioId: "cliente-a",
    fechaHora: new Date("2026-11-19T12:30:00.000Z"),
    motivo: "Ruido en el tren delantero",
    estado,
    fechaCreacion: new Date("2026-11-09T12:00:00.000Z"),
    vehiculo: { id: "vehiculo-1", patente: "TEST01", marca: "Fiat", modelo: "Cronos" },
    ordenTrabajo,
  };
}

async function abrirDetalle(usuario: unknown, turno: ReturnType<typeof turnoCon>) {
  mocks.obtenerUsuario.mockResolvedValue(usuario);
  mocks.buscarTurno.mockResolvedValue({ resultado: "OK", turno });
  return DetalleTurno({ params: Promise.resolve({ id: "turno-1" }) });
}

describe("qué botones muestra el detalle del turno", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const usuarios = { Mecánico: mecanico, Administrador: admin, Cliente: cliente };
  it.each([
    ["Mecánico", "PENDIENTE", "sin orden", "Confirmar"],
    ["Administrador", "PENDIENTE", "sin orden", "Confirmar"],
    ["Mecánico", "CONFIRMADO", "sin orden", "Registrar ingreso"],
    ["Administrador", "CONFIRMADO", "sin orden", "Registrar ingreso"],
    ["Mecánico", "CONFIRMADO", "con orden", "ninguno"],
    ["Mecánico", "CANCELADO", "sin orden", "ninguno"],
    ["Cliente", "PENDIENTE", "sin orden", "Cancelar"],
    ["Cliente", "CONFIRMADO", "sin orden", "Cancelar"],
    ["Cliente", "CONFIRMADO", "con orden", "ninguno"],
    ["Cliente", "CANCELADO", "sin orden", "ninguno"],
  ] as const)("%s, turno %s %s: %s", async (rol, estado, orden, boton) => {
    const ordenTrabajo = orden === "con orden" ? { id: "orden-1" } : null;
    const pagina = await abrirDetalle(usuarios[rol], turnoCon(estado, ordenTrabajo));
    const [props] = propsDe(pagina, AccionesTurno);
    expect(props).toEqual({
      turnoId: "turno-1",
      mostrarConfirmar: boton === "Confirmar",
      mostrarIngreso: boton === "Registrar ingreso",
      mostrarCancelar: boton === "Cancelar",
    });
  });

  it("con orden de trabajo, enlaza a la orden, también para el cliente", async () => {
    for (const usuario of [cliente, mecanico]) {
      const pagina = await abrirDetalle(usuario, turnoCon("CONFIRMADO", { id: "orden-1" }));
      const enlaces = propsDe(pagina, Link).map((props) => props.href);
      expect(enlaces).toContain("/ordenes-trabajo/orden-1");
    }
    const sinOrden = await abrirDetalle(mecanico, turnoCon("CONFIRMADO", null));
    expect(propsDe(sinOrden, Link).map((props) => props.href)).not.toContain(
      "/ordenes-trabajo/orden-1",
    );
  });
});

describe("anuncio de un éxito", () => {
  // Un lector de pantalla anuncia los cambios de una región role="status" que
  // ya estaba en la página; por eso tiene que existir, vacía, desde el principio.
  it.each([
    ["confirmar", { mostrarConfirmar: true, mostrarCancelar: false, mostrarIngreso: false }],
    ["cancelar", { mostrarConfirmar: false, mostrarCancelar: true, mostrarIngreso: false }],
  ])("con el botón de %s, la región de estado está antes de apretarlo", (_boton, botones) => {
    const html = renderToString(createElement(AccionesTurno, { turnoId: "turno-1", ...botones }));
    expect(html).toMatch(/<p role="status" class="sr-only"><\/p>/);
  });
});
