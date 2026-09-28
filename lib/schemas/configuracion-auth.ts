import { z } from "zod";
export const configuracionAdminInicialSchema = z.object({
  email: z.string().trim().email("BOOTSTRAP_ADMIN_EMAIL no contiene un correo válido").transform((email) => email.toLowerCase()),
});
