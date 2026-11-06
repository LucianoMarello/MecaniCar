import { isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  obtenerUsuario: vi.fn(),
  crearTurno: vi.fn(),
  listarTurnos: vi.fn(),
  buscarTurno: vi.fn(),
  listarVehiculos: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("@/lib/auth", () => ({ obtenerUsuario: mocks.obtenerUsuario }));
vi.mock("@/lib/db/turnos", () => ({
  crearTurno: mocks.crearTurno,
  listarTurnos: mocks.listarTurnos,
  buscarTurno: mocks.buscarTurno,
}));
vi.mock("@/lib/db/vehiculos", () => ({ listarVehiculos: mocks.listarVehiculos }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound,
}));

import { solicitarTurno } from "./(app)/turnos/nuevo/acciones";
import { FormularioTurno } from "./(app)/turnos/nuevo/FormularioTurno";
import NuevoTurno from "./(app)/turnos/nuevo/page";
import Turnos from "./(app)/turnos/page";
import DetalleTurno from "./(app)/turnos/[id]/page";
import { SIN_ENVIAR } from "@/lib/formularios";

const cliente = { id: "cliente-a", email: "a@example.com", nombre: "A", rol: "CLIENTE" };
const mecanico = { id: "mecanico-1", email: "m@example.com", nombre: "M", rol: "MECANICO" };

function formulario(campos: Record<string, string>) {
  const datos = new FormData();
  for (const [nombre, valor] of Object.entries(campos)) datos.set(nombre, valor);
  return datos;
}

const valido = {
  vehiculoId: "vehiculo-1",
  fechaHora: `${new Date().getFullYear() + 1}-03-10T09:30`,
  motivo: "Ruido en el tren delantero",
};
const sinParametros = { searchParams: Promise.resolve({}) };

// Recorre lo que devuelve una página y da las props del componente buscado.
function propsDe(nodo: unknown, tipo: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(nodo)) {
    for (const hijo of nodo) {
      const props = propsDe(hijo, tipo);
      if (props) return props;
    }
    return undefined;
  }
  if (!isValidElement(nodo)) return undefined;
  const props = nodo.props as Record<string, unknown>;
  return nodo.type === tipo ? props : propsDe(props.children, tipo);
}

describe("solicitar turno desde el formulario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.obtenerUsuario.mockResolvedValue(cliente);
  });

  it("sin sesión redirige al ingreso antes de escribir", async () => {
    mocks.obtenerUsuario.mockResolvedValue(null);
    await expect(solicitarTurno(SIN_ENVIAR, formulario(valido))).rejects.toThrow(
      "REDIRECT:/ingresar",
    );
    expect(mocks.crearTurno).not.toHaveBeenCalled();
  });

  it("un mecánico que llama a la acción directamente no escribe", async () => {
    mocks.obtenerUsuario.mockResolvedValue(mecanico);
    const estado = await solicitarTurno(SIN_ENVIAR, formulario(valido));
    expect(estado.mensaje).toBe("Solo un cliente puede solicitar turnos.");
    expect(mocks.crearTurno).not.toHaveBeenCalled();
  });

  it("los errores van por campo y conservan lo escrito", async () => {
    const campos = { vehiculoId: "", fechaHora: "2020-01-01T10:00", motivo: "Mal" };
    const estado = await solicitarTurno(SIN_ENVIAR, formulario(campos));
    expect(estado.errores?.vehiculoId).toEqual(["Elegí un vehículo"]);
    expect(estado.errores?.fechaHora).toEqual([
      "La fecha del turno debe ser posterior a la fecha actual",
    ]);
    expect(estado.errores?.motivo).toBeDefined();
    expect(estado.valores).toEqual(campos);
    expect(mocks.crearTurno).not.toHaveBeenCalled();
  });

  it("un vehículo ajeno se informa arriba (RN05)", async () => {
    mocks.crearTurno.mockResolvedValue({ resultado: "VEHICULO_NO_EXISTE" });
    const estado = await solicitarTurno(SIN_ENVIAR, formulario(valido));
    expect(estado.mensaje).toBe(
      "El vehículo elegido no está entre tus vehículos registrados.",
    );
    expect(estado.valores).toEqual(valido);
  });

  it("guarda la hora argentina con el id de la sesión y va al detalle", async () => {
    mocks.crearTurno.mockResolvedValue({ resultado: "CREADO", turno: { id: "turno-1" } });
    const datos = formulario({ ...valido, usuarioId: "otro-cliente" });
    await expect(solicitarTurno(SIN_ENVIAR, datos)).rejects.toThrow(
      "REDIRECT:/turnos/turno-1",
    );
    expect(mocks.crearTurno).toHaveBeenCalledWith(
      expect.objectContaining({
        fechaHora: new Date(`${new Date().getFullYear() + 1}-03-10T12:30:00.000Z`),
      }),
      "cliente-a",
    );
    expect(mocks.crearTurno.mock.lastCall?.[0]).not.toHaveProperty("usuarioId");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/turnos");
  });
});

describe("pantallas de turnos: sesión y acceso", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.obtenerUsuario.mockResolvedValue(cliente);
    mocks.listarTurnos.mockResolvedValue([]);
    mocks.listarVehiculos.mockResolvedValue([]);
  });

  it("solicitar turno es solo para clientes y lista sus propios vehículos", async () => {
    mocks.obtenerUsuario.mockResolvedValue(mecanico);
    await expect(NuevoTurno(sinParametros)).rejects.toThrow("NOT_FOUND");
    mocks.obtenerUsuario.mockResolvedValue(cliente);
    await NuevoTurno(sinParametros);
    expect(mocks.listarVehiculos).toHaveBeenCalledWith("cliente-a", "CLIENTE", {
      pagina: 1,
      limite: 100,
    });
  });

  it("?vehiculo= preselecciona solo un vehículo propio con id válido", async () => {
    mocks.listarVehiculos.mockResolvedValue([
      { id: "vehiculo-1", patente: "AB123CD", marca: "Ford", modelo: "Focus" },
    ]);
    const casos: [string | string[], string][] = [
      ["vehiculo-1", "vehiculo-1"],
      ["vehiculo-ajeno", ""],
      ["../x", ""],
      [["vehiculo-1", "vehiculo-2"], ""],
    ];
    for (const [vehiculo, esperado] of casos) {
      const pagina = await NuevoTurno({ searchParams: Promise.resolve({ vehiculo }) });
      expect(propsDe(pagina, FormularioTurno)?.vehiculoInicial).toBe(esperado);
    }
  });

  it("el taller lista los turnos con su propio id y rol", async () => {
    mocks.obtenerUsuario.mockResolvedValue(mecanico);
    await Turnos(sinParametros);
    expect(mocks.listarTurnos).toHaveBeenCalledWith("mecanico-1", "MECANICO", {
      pagina: 1,
      limite: 20,
    });
  });

  it("sin sesión el listado redirige antes de consultar", async () => {
    mocks.obtenerUsuario.mockResolvedValue(null);
    await expect(Turnos(sinParametros)).rejects.toThrow("REDIRECT:/ingresar");
    expect(mocks.listarTurnos).not.toHaveBeenCalled();
  });

  it("el listado usa el id y el rol de la sesión", async () => {
    await Turnos({ searchParams: Promise.resolve({ pagina: "2" }) });
    expect(mocks.listarTurnos).toHaveBeenCalledWith("cliente-a", "CLIENTE", {
      pagina: 2,
      limite: 20,
    });
  });

  it("una página inválida no consulta la base", async () => {
    await expect(Turnos({ searchParams: Promise.resolve({ pagina: "0" }) })).rejects.toThrow(
      "NOT_FOUND",
    );
    expect(mocks.listarTurnos).not.toHaveBeenCalled();
  });

  it("un turno ajeno o inexistente da el mismo 404", async () => {
    mocks.buscarTurno.mockResolvedValue({ resultado: "NO_EXISTE" });
    await expect(DetalleTurno({ params: Promise.resolve({ id: "turno-ajeno" }) })).rejects.toThrow(
      "NOT_FOUND",
    );
    expect(mocks.buscarTurno).toHaveBeenCalledWith("turno-ajeno", "cliente-a", "CLIENTE");
  });

  it("un id inválido no llega a la base", async () => {
    await expect(DetalleTurno({ params: Promise.resolve({ id: "../x" }) })).rejects.toThrow(
      "NOT_FOUND",
    );
    expect(mocks.buscarTurno).not.toHaveBeenCalled();
  });
});
