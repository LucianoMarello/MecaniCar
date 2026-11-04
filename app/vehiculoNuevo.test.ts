import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  obtenerUsuario: vi.fn(),
  crearVehiculo: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("@/lib/auth", () => ({ obtenerUsuario: mocks.obtenerUsuario }));
vi.mock("@/lib/db/vehiculos", () => ({ crearVehiculo: mocks.crearVehiculo }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound,
}));

import { registrarVehiculo } from "./(app)/vehiculos/nuevo/acciones";
import NuevoVehiculo from "./(app)/vehiculos/nuevo/page";
import { SIN_ENVIAR } from "@/lib/formularios";

const cliente = { id: "cliente-a", email: "a@example.com", nombre: "A", rol: "CLIENTE" };
const mecanico = { id: "mecanico-1", email: "m@example.com", nombre: "M", rol: "MECANICO" };

function formulario(campos: Record<string, string>) {
  const datos = new FormData();
  for (const [nombre, valor] of Object.entries(campos)) datos.set(nombre, valor);
  return datos;
}

const valido = { patente: "ab 123 cd", marca: "Fiat", modelo: "Cronos", anio: "" };

describe("alta de vehículo desde el formulario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.obtenerUsuario.mockResolvedValue(cliente);
  });

  it("sin sesión redirige al ingreso antes de validar o escribir", async () => {
    mocks.obtenerUsuario.mockResolvedValue(null);
    await expect(registrarVehiculo(SIN_ENVIAR, formulario(valido))).rejects.toThrow(
      "REDIRECT:/ingresar",
    );
    expect(mocks.crearVehiculo).not.toHaveBeenCalled();
  });

  it("un mecánico que llama a la acción directamente no escribe", async () => {
    mocks.obtenerUsuario.mockResolvedValue(mecanico);
    const estado = await registrarVehiculo(SIN_ENVIAR, formulario(valido));
    expect(estado.mensaje).toBe("Solo un cliente puede registrar vehículos.");
    expect(mocks.crearVehiculo).not.toHaveBeenCalled();
  });

  it("los errores de validación van por campo y conservan lo escrito", async () => {
    const campos = { patente: "AB", marca: "Fiat", modelo: "", anio: "dos mil" };
    const estado = await registrarVehiculo(SIN_ENVIAR, formulario(campos));
    expect(estado.errores?.patente).toBeDefined();
    expect(estado.errores?.modelo).toEqual(["El modelo es obligatorio"]);
    expect(estado.errores?.anio).toEqual(["El año debe ser un número"]);
    expect(estado.valores).toEqual(campos);
    expect(mocks.crearVehiculo).not.toHaveBeenCalled();
  });

  it("la patente duplicada se informa arriba y conserva lo escrito", async () => {
    mocks.crearVehiculo.mockResolvedValue({ resultado: "PATENTE_DUPLICADA" });
    const estado = await registrarVehiculo(SIN_ENVIAR, formulario(valido));
    expect(estado.mensaje).toContain("AB123CD");
    expect(estado.errores).toBeUndefined();
    expect(estado.valores).toEqual(valido);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("guarda con el id de la sesión, ignora uno enviado en el formulario y va al detalle", async () => {
    mocks.crearVehiculo.mockResolvedValue({ resultado: "CREADO", vehiculo: { id: "vehiculo-1" } });
    const datos = formulario({ ...valido, anio: "2023", usuarioId: "otro-cliente" });
    await expect(registrarVehiculo(SIN_ENVIAR, datos)).rejects.toThrow(
      "REDIRECT:/vehiculos/vehiculo-1",
    );
    expect(mocks.crearVehiculo).toHaveBeenCalledWith(
      { patente: "AB123CD", marca: "Fiat", modelo: "Cronos", anio: 2023 },
      "cliente-a",
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/vehiculos");
  });

  it("la pantalla es solo para clientes", async () => {
    mocks.obtenerUsuario.mockResolvedValue(null);
    await expect(NuevoVehiculo()).rejects.toThrow("REDIRECT:/ingresar");
    mocks.obtenerUsuario.mockResolvedValue(mecanico);
    await expect(NuevoVehiculo()).rejects.toThrow("NOT_FOUND");
  });
});
