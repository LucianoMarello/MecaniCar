# Proyecto MDW 2026 — MecaniCar

**Equipo:**

- Luciano Marello — responsable del repositorio (creó el repo y tiene la cuenta de Vercel)
- Pedro Cabral
- Mauro Gobernatori

**Producción:** [https://mecani-car.vercel.app/](https://mecani-car.vercel.app/)

**Problema que resuelve:** La gestión de clientes, vehículos, turnos y presupuestos se realiza mediante anotaciones manuales o WhatsApp, dificultando el seguimiento de cada reparación y la comunicación.

**Flujo principal:** El cliente registra su vehículo y solicita un turno. El mecánico registra el ingreso, genera una orden de trabajo y arma un presupuesto. El cliente lo aprueba online, el taller ejecuta el trabajo y finaliza la orden.

**Alcance del MVP:**

- Gestión de vehículos y turnos.
- Gestión de órdenes de trabajo.
- Catálogo de servicios (como lista de precios).
- Generación, aprobación y rechazo de presupuestos.
- Avisos por correo al cliente cuando el taller hace avanzar su atención.
- Inicio de sesión con Google y tres roles: Cliente, Mecánico y Administrador.

---

## Puesta en marcha

Requisitos: Node 20+, npm, una base de datos **Postgres** (usamos Supabase) y una credencial de OAuth de Google.

```bash
npm install
cp .env.example .env.local     # completar las variables; cada una está explicada en el archivo
npx prisma migrate dev
npm run db:seed
npm run dev                       # http://localhost:3000
```

El seed crea al administrador inicial con el correo de `BOOTSTRAP_ADMIN_EMAIL`: tiene que ser la cuenta de Google con la que esa persona va a iniciar sesión.

Generar el `AUTH_SECRET`:

```bash
npx auth secret
```

> Usen **npm** en todo el equipo y commiteen el `package-lock.json`. Si alguien instala con otro gestor aparece un segundo lockfile y las instalaciones dejan de ser reproducibles.

## Comandos

| Comando                  | Para qué                                        |
| ------------------------ | ----------------------------------------------- |
| `npm run dev`            | Levantar en desarrollo                          |
| `npm run build`          | Build de producción (lo mismo que corre Vercel) |
| `npm run lint`           | Lint                                            |
| `npm run typecheck`      | Chequeo de tipos sin emitir                     |
| `npm test`               | Pruebas de reglas y Route Handlers (vitest)     |
| `npm run test:e2e`       | Pruebas del sistema entero (Playwright)         |
| `npx prisma migrate dev` | Crear y aplicar una migración                   |
| `npx prisma studio`      | Ver y editar los datos a mano                   |
| `npm run db:seed`        | Cargar datos de ejemplo                         |

## Pruebas

Dos capas, con dos comandos:

- `npm test`: las reglas de negocio y los Route Handlers, con vitest. Sin base ni red.
- `npm run test:e2e`: el sistema entero, con Playwright. Aplica las migraciones y el seed en la base de `.env.e2e`, compila la app y la levanta en el puerto 3100, así que no choca con `npm run dev`.

El CI corre las dos en cada Pull Request, con una base propia que se borra al terminar. Para correr las e2e en tu máquina hace falta una base local. Las e2e **nunca corren contra la base de producción**: `playwright.config.ts` se niega a arrancar si la base no es local.

La primera vez, creá la base con el mismo usuario que usa el CI. Con PostgreSQL instalado, abrí "SQL Shell (psql)", entrá como `postgres` y pegá:

```sql
CREATE ROLE e2e LOGIN PASSWORD 'e2e';
CREATE DATABASE mecanicar_e2e OWNER e2e;
```

O, con Docker (si no tenés otro PostgreSQL usando el puerto 5432):

```bash
docker run -d --name mecanicar-e2e -e POSTGRES_USER=e2e -e POSTGRES_PASSWORD=e2e -e POSTGRES_DB=mecanicar_e2e -p 5432:5432 postgres:18-alpine
```

Y el navegador de las pruebas, una sola vez:

```bash
npx playwright install chromium
```

Después, cada vez:

```bash
npm run test:e2e                  # las corre todas en la terminal
npm run test:e2e -- --ui          # interfaz visual: paso a paso, con la pantalla de cada uno
npm run test:e2e -- --headed      # muestra el navegador mientras corre
npx playwright show-trace test-results/<prueba>/trace.zip   # el recorrido de una que falló
```

## Estructura

```
app/                    rutas (App Router)
  (public)/             páginas sin sesión
  (app)/                páginas con sesión
  api/                  Route Handlers
components/             componentes de UI
e2e/                    pruebas del sistema entero (Playwright)
lib/
  db/                   acceso a datos — ÚNICO lugar que habla con Prisma
  schemas/              schemas de Zod (validación + tipos)
  servicios/            integraciones con servicios externos (Resend)
  auth.ts               configuración de sesión y roles
prisma/
  schema.prisma         modelo de datos
  seed.ts               datos de ejemplo
docs/
  spec.md               qué hace el sistema (requerimientos)
  api.md                contrato de la API REST
  adr/                  decisiones técnicas y por qué
```

## Reglas del equipo

- Nadie pushea a `main`. Todo entra por Pull Request con al menos 1 aprobación.
- Las convenciones de código están en [`AGENTS.md`](./AGENTS.md) — mantenerlo al día es responsabilidad del equipo.
- Una decisión técnica que cueste revertir se documenta como ADR en `docs/adr/`.

## Definition of Done

Una tarea está terminada cuando:

- [ ] Funciona en el preview deployment, no solo en la máquina de quien la escribió.
- [ ] La validación está en el servidor, no solo en el cliente.
- [ ] Los estados de carga y error están resueltos en la UI.
- [ ] `npm run build` y `npm run typecheck` pasan.
- [ ] Alguien más del equipo la revisó y puede explicarla.
