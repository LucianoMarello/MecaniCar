import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  obtenerUsuario: vi.fn(),
  listarVehiculos: vi.fn(),
  buscarVehiculo: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("@/lib/auth", () => ({ obtenerUsuario: mocks.obtenerUsuario }));
vi.mock("@/lib/db/vehiculos", () => ({
  listarVehiculos: mocks.listarVehiculos,
  buscarVehiculo: mocks.buscarVehiculo,
}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound,
}));

import Vehiculos from "./(app)/vehiculos/page";
import DetalleVehiculo from "./(app)/vehiculos/[id]/page";
import LayoutPrivado from "./(app)/layout";
import Sistema from "./(app)/sistema/page";
import Home from "./(public)/page";
import Ingresar from "./(public)/ingresar/page";

const cliente = {
  id: "cliente-a",
  email: "a@example.com",
  nombre: "Cliente A",
  rol: "CLIENTE",
};

describe("pantallas de vehículos: sesión y acceso al modelo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.obtenerUsuario.mockResolvedValue(cliente);
    mocks.listarVehiculos.mockResolvedValue([]);
  });

  it("el layout deja a la página decidir el destino de ingreso sin mostrar navegación privada", async () => {
    mocks.obtenerUsuario.mockResolvedValue(null);
    expect(await LayoutPrivado({ children: null })).toBeNull();
  });

  it("la galería también verifica la sesión sin depender del layout", async () => {
    mocks.obtenerUsuario.mockResolvedValue(null);
    await expect(Sistema()).rejects.toThrow("REDIRECT:/ingresar");
    expect(mocks.listarVehiculos).not.toHaveBeenCalled();
  });

  it("la portada lleva al listado a quien ya tiene sesión", async () => {
    await expect(Home()).rejects.toThrow("REDIRECT:/vehiculos");
  });

  it("la pantalla de ingreso no vuelve a pedir Google a un usuario autenticado", async () => {
    await expect(Ingresar({})).rejects.toThrow("REDIRECT:/vehiculos");
  });

  it("el ingreso conserva el detalle para una sesión ya iniciada", async () => {
    await expect(
      Ingresar({
        searchParams: Promise.resolve({ callbackUrl: "/vehiculos/vehiculo-a" }),
      }),
    ).rejects.toThrow("REDIRECT:/vehiculos/vehiculo-a");
  });

  it("la galería autenticada usa ejemplos, sin consultar vehículos", async () => {
    expect(await Sistema()).toBeTruthy();
    expect(mocks.listarVehiculos).not.toHaveBeenCalled();
    expect(mocks.buscarVehiculo).not.toHaveBeenCalled();
  });

  it("sin sesión redirige el listado antes de consultar vehículos", async () => {
    mocks.obtenerUsuario.mockResolvedValue(null);
    await expect(
      Vehiculos({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("REDIRECT:");
    expect(mocks.listarVehiculos).not.toHaveBeenCalled();
  });

  it("sin sesión redirige el detalle antes de buscar el vehículo", async () => {
    mocks.obtenerUsuario.mockResolvedValue(null);
    await expect(
      DetalleVehiculo({ params: Promise.resolve({ id: "vehiculo-a" }) }),
    ).rejects.toThrow(
      "REDIRECT:/ingresar?callbackUrl=%2Fvehiculos%2Fvehiculo-a",
    );
    expect(mocks.buscarVehiculo).not.toHaveBeenCalled();
  });

  it("el listado usa el id y rol de la sesión y la página validada", async () => {
    await Vehiculos({
      searchParams: Promise.resolve({
        pagina: "2",
        usuarioId: "otro",
        rol: "ADMIN",
      }),
    });
    expect(mocks.listarVehiculos).toHaveBeenCalledWith("cliente-a", "CLIENTE", {
      pagina: 2,
      limite: 20,
    });
  });

  it("una página inválida no consulta la base", async () => {
    await expect(
      Vehiculos({ searchParams: Promise.resolve({ pagina: "0" }) }),
    ).rejects.toThrow("NOT_FOUND");
    expect(mocks.listarVehiculos).not.toHaveBeenCalled();
  });

  it("usa la consulta autorizada y muestra 404 para un recurso ajeno o inexistente", async () => {
    mocks.buscarVehiculo.mockResolvedValue({ resultado: "NO_EXISTE" });
    await expect(
      DetalleVehiculo({ params: Promise.resolve({ id: "vehiculo-ajeno" }) }),
    ).rejects.toThrow("NOT_FOUND");
    expect(mocks.buscarVehiculo).toHaveBeenCalledWith(
      "vehiculo-ajeno",
      "cliente-a",
      "CLIENTE",
    );
  });

  it("un identificador inválido no llega al modelo", async () => {
    await expect(
      DetalleVehiculo({ params: Promise.resolve({ id: "id no valido" }) }),
    ).rejects.toThrow("NOT_FOUND");
    expect(mocks.buscarVehiculo).not.toHaveBeenCalled();
  });

  it("el detalle autorizado se construye con el resultado del modelo", async () => {
    mocks.buscarVehiculo.mockResolvedValue({
      resultado: "OK",
      vehiculo: {
        id: "vehiculo-a",
        patente: "ABC123",
        marca: "Ford",
        modelo: "Fiesta",
        anio: 2020,
        createdAt: new Date("2026-10-01T02:00:00Z"),
        updatedAt: new Date("2026-10-01T02:00:00Z"),
      },
    });
    expect(
      await DetalleVehiculo({ params: Promise.resolve({ id: "vehiculo-a" }) }),
    ).toBeTruthy();
    expect(mocks.notFound).not.toHaveBeenCalled();
  });
});
