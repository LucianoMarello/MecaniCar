import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las pruebas e2e compilan en `.next-e2e` para no pisar el `.next` de un
  // `npm run dev` que esté corriendo al mismo tiempo (playwright.config.ts).
  distDir: process.env.NEXT_DIST_DIR || ".next",

  // El build falla si hay errores de tipos. Es a propósito: preferimos
  // enterarnos en el Pull Request y no en producción. Desde Next 16 el build ya
  // no corre el lint: lo corre el CI con `npm run lint`.
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
