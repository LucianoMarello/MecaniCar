import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enviarNotificacion } from "./notificaciones";

// Resend es accesorio (docs/spec.md, sección 9): pase lo que pase del otro
// lado, el módulo tiene que devolver un booleano y nunca lanzar.

const aviso = {
  destinatario: "cliente@example.com",
  asunto: "Turno confirmado",
  mensaje: "Tu turno fue confirmado",
};

function simularResend(respuesta: () => Promise<Response>) {
  const fetchSimulado = vi.fn<typeof fetch>(respuesta);
  vi.stubGlobal("fetch", fetchSimulado);
  return fetchSimulado;
}

describe("Servicio externo: notificaciones", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "clave-de-prueba");
    vi.stubEnv("RESEND_FROM_EMAIL", "taller@example.com");
    vi.stubEnv("RESEND_TEST_RECIPIENT", "");
    // La falla se loguea a propósito; se silencia para no ensuciar la salida.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("devuelve true cuando Resend acepta el correo, y lo llama con timeout", async () => {
    const fetchSimulado = simularResend(async () =>
      Response.json({ id: "correo-1" }),
    );

    expect(await enviarNotificacion(aviso)).toBe(true);

    const opciones = fetchSimulado.mock.calls[0]?.[1];
    expect(opciones?.signal).toBeInstanceOf(AbortSignal);
  });

  it("sin credencial devuelve false y ni siquiera llama a Resend", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchSimulado = simularResend(async () =>
      Response.json({ id: "correo-1" }),
    );

    expect(await enviarNotificacion(aviso)).toBe(false);
    expect(fetchSimulado).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("devuelve false si Resend rechaza la credencial (401)", async () => {
    simularResend(async () =>
      Response.json({ message: "API key is invalid" }, { status: 401 }),
    );

    expect(await enviarNotificacion(aviso)).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it("devuelve false, sin lanzar, si Resend no responde o vence el timeout", async () => {
    simularResend(async () => {
      throw new DOMException("The operation timed out", "TimeoutError");
    });

    expect(await enviarNotificacion(aviso)).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it("devuelve false si la respuesta de Resend no tiene la forma esperada", async () => {
    simularResend(async () => Response.json({ sinId: true }));

    expect(await enviarNotificacion(aviso)).toBe(false);
  });
});
