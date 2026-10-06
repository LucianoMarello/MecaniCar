import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MecaniCar",
  description: "Gestión de turnos, órdenes de trabajo y presupuestos de un taller mecánico",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
