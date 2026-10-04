import { z } from "zod";

const TIMEOUT_MS = 5_000;
const RESEND_URL = "https://api.resend.com/emails";

const respuestaResendSchema = z.object({
  id: z.string().min(1),
});

type NotificacionInput = {
  destinatario: string;
  asunto: string;
  mensaje: string;
};

export async function enviarNotificacion(
  datos: NotificacionInput,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const remitente = process.env.RESEND_FROM_EMAIL;

  // Para la demostración se envía todo al correo propio.
  // En producción, si queda vacío, usa el correo real del cliente.
  const destinatario =
    process.env.RESEND_TEST_RECIPIENT || datos.destinatario;

  if (!apiKey || !remitente) {
    console.error("notificaciones: Resend no está configurado");
    return false;
  }

  try {
    const respuesta = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: remitente,
        to: [destinatario],
        subject: datos.asunto,
        text: datos.mensaje,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!respuesta.ok) {
      console.error("notificaciones: Resend rechazó el mensaje", {
        status: respuesta.status,
      });
      return false;
    }

    const resultado = respuestaResendSchema.safeParse(
      await respuesta.json(),
    );

    if (!resultado.success) {
      console.error("notificaciones: respuesta inválida de Resend");
      return false;
    }

    return true;
  } catch (error) {
    console.error("notificaciones: proveedor no disponible", { error });
    return false;
  }
}
