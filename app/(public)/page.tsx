import {
  obtenerUsuario,
  signIn,
  signOut,
  type UsuarioSesion,
} from "@/lib/auth";

// La página cambia según haya o no sesión, así que se arma en cada request.
export const dynamic = "force-dynamic";

const NOMBRE_ROL: Record<UsuarioSesion["rol"], string> = {
  CLIENTE: "Cliente",
  MECANICO: "Mecánico",
  ADMIN: "Administrador",
};

const PASOS = [
  "El cliente registra su vehículo y solicita un turno.",
  "El taller confirma el turno y registra el ingreso del vehículo.",
  "El mecánico arma un presupuesto con los servicios del catálogo.",
  "El cliente lo aprueba o lo rechaza.",
  "El taller realiza el trabajo y finaliza la orden.",
];

const ESTILO_BOTON =
  "mt-4 cursor-pointer rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background focus-visible:outline-2 focus-visible:outline-offset-2";

// Server Actions: corren en el servidor al enviar cada formulario.
async function iniciarSesion() {
  "use server";
  await signIn("google", { redirectTo: "/" });
}

async function cerrarSesion() {
  "use server";
  await signOut({ redirectTo: "/" });
}

async function leerSesion() {
  // Si la base no responde, la portada se muestra igual, sin sesión.
  try {
    return await obtenerUsuario();
  } catch (error) {
    console.error("portada: no se pudo leer la sesión", error);
    return null;
  }
}

export default async function Home() {
  const usuario = await leerSesion();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold">MecaniCar</h1>
      <p className="mt-2">
        Gestión de un taller mecánico: turnos, órdenes de trabajo y
        presupuestos, en un solo lugar para el cliente y para el taller.
      </p>

      <section className="mt-8 rounded-md border border-foreground/20 p-4">
        {usuario ? (
          <>
            <p>
              Sesión iniciada como <strong>{usuario.nombre}</strong> (
              {usuario.email}).
            </p>
            <p className="mt-1">
              Rol: <strong>{NOMBRE_ROL[usuario.rol]}</strong>
            </p>
            <form action={cerrarSesion}>
              <button type="submit" className={ESTILO_BOTON}>
                Cerrar sesión
              </button>
            </form>
          </>
        ) : (
          <>
            <p>Para usar el sistema, ingresá con tu cuenta de Google.</p>
            <form action={iniciarSesion}>
              <button type="submit" className={ESTILO_BOTON}>
                Iniciar sesión con Google
              </button>
            </form>
          </>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Cómo funciona</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-6">
          {PASOS.map((paso) => (
            <li key={paso}>{paso}</li>
          ))}
        </ol>
      </section>

      <p className="mt-8 text-sm">
        Las pantallas del sistema están en desarrollo. Hoy las operaciones se
        realizan a través de la API.
      </p>

      <footer className="mt-8 border-t border-foreground/20 pt-4 text-sm">
        Proyecto de Metodologías de Desarrollo Web 2026 — UAI. Equipo: Luciano
        Marello, Pedro Cabral y Mauro Gobernatori.
      </footer>
    </main>
  );
}
