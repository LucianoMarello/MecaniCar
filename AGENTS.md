# AGENTS.md — reglas de este proyecto

Este archivo lo lee tu asistente de IA (Cursor, Copilot, Claude Code, etc.) antes de escribir código. Manténlo actualizado: si el equipo cambia una convención y esto no lo refleja, la IA va a seguir escribiendo con la convención vieja.

> **Cómo se escribe una regla acá:** verificable, no aspiracional. "Escribir código limpio" no es una regla. "Un componente por archivo, en PascalCase" sí lo es.

## Qué es este proyecto

MecaniCar es una aplicación web destinada a facilitar la gestión de un taller mecánico y centralizar la información de las reparaciones.

- **Roles:** Cliente (registra vehículos, solicita turnos, consulta el estado de sus órdenes y aprueba o rechaza presupuestos), Mecánico (gestiona turnos, órdenes de trabajo y el catálogo de servicios, y emite presupuestos) y Administrador (un mecánico que además asigna roles).
- **Flujo principal:** El cliente solicita un turno, el taller lo confirma, registra el ingreso del vehículo y genera un presupuesto, el cliente lo aprueba y el taller ejecuta y finaliza el trabajo.

## Especificación y Alcance

Lo que el sistema tiene que hacer está en [`docs/spec.md`](./docs/spec.md).

- **Entidades permitidas:** Vehiculo, Turno, OrdenTrabajo, Presupuesto, Servicio, DetallePresupuesto. No agregues entidades nuevas para inflar la complejidad.
- **Fuera de alcance:** Control de stock físico, compras, proveedores y facturación. No escribas código para esto.
- **Antes de escribir lógica de dominio, leelo.** Si algo no está ahí, preguntá antes de inventarlo.

## Stack

- Next.js (App Router) + TypeScript
- Postgres (Supabase) + Prisma
- Zod para validación
- Auth.js para sesión y roles, con Google como proveedor
- Resend para los avisos por correo
- Tailwind + shadcn/ui
- Deploy en Vercel

## Comandos

```bash
npm run dev          # desarrollo
npm run build        # build de producción
npm run typecheck    # chequeo de tipos
npm test         # tests
npx prisma migrate dev --name <nombre>
```

Después de tocar `prisma/schema.prisma`, siempre generar una migración. Nunca editar SQL de migraciones ya aplicadas.

## Estructura y dónde va cada cosa

| Si vas a escribir…         | Va en…                                                            |
| -------------------------- | ----------------------------------------------------------------- |
| Una página                 | `app/(public)/` si es sin sesión, `app/(app)/` si requiere sesión |
| Un endpoint                | `app/api/<recurso>/route.ts`                                      |
| Un componente reutilizable | `components/`                                                     |
| Una consulta a la base     | `lib/db/<entidad>.ts`                                             |
| Un schema de validación    | `lib/schemas/<entidad>.ts`                                        |
| Un helper sin dependencias | `lib/utils.ts`                                                    |

## Reglas

### Datos

- **Todo acceso a la base pasa por `lib/db/`.** Está prohibido importar el cliente de Prisma en componentes o en `app/`.
- El cliente de Prisma se importa solo desde `lib/db/client.ts`.
- Toda consulta que devuelva listas tiene paginación o límite explícito.
- Los importes monetarios deben utilizar `Decimal` y no `Float` en el schema.
- No almacenar información derivada cuando pueda calcularse de forma segura a partir de otros datos (ej: el total de un presupuesto).
- No utilizar datos del negocio (como una patente o DNI) como claves primarias.

### Validación

- **Toda entrada externa se valida con un schema de Zod** definido en `lib/schemas/`. Entrada externa = body de un request, params, query string, formulario, respuesta de una API de terceros.
- El mismo schema se usa en el cliente y en el servidor. No duplicar reglas de validación.
- El tipo se **deriva** del schema con `z.infer`. No se escribe un `type` aparte que después se desincroniza.
- Todo campo con un conjunto conocido de valores —estados, roles, categorías— va como **unión literal** (`z.enum`), nunca `string`.
- Las fechas relativas a "ahora" se validan con `.refine()`, no con `.max(new Date())`: ese `new Date()` se evalúa al construir el schema y queda congelado al arrancar el servidor.
- Prohibido `any`. Si no se conoce el tipo, usar `unknown` y validar.

## API

- Los endpoints REST deben utilizar sustantivos para representar recursos (`POST /api/turnos`). Prohibidos los verbos en la URL (`/api/crearTurno`).
- Los Route Handlers deben mantener este orden estricto de ejecución: 1. Validar, 2. Autorizar, 3. Ejecutar operación, 4. Responder.

### Seguridad

- **La autorización se verifica siempre en el servidor**, en cada Route Handler y cada Server Action. Que la UI esconda un botón no es una medida de seguridad.
- Nunca confiar en un `userId` o un `role` que venga del cliente: se leen de la sesión.
- Los secretos van en variables de entorno. Ninguna variable con secretos lleva el prefijo `NEXT_PUBLIC_`.

### React / Next

- Los componentes son Server Components por defecto. `"use client"` solo si hay estado, efectos o eventos del navegador.
- Un componente por archivo, en PascalCase. Los archivos de utilidades, en camelCase.
- Los estados de carga y de error se resuelven siempre; no dejar la pantalla en blanco.

### Estilos

- Solo Tailwind. Nada de CSS suelto ni estilos inline salvo valores calculados en runtime.
- Los componentes de UI base salen de shadcn/ui y se editan en `components/ui/`.

### Git

- Ramas: `feat/<descripcion-corta>`, `fix/<descripcion-corta>`.
- Commits en imperativo y en español: "agrega validación de turnos superpuestos".
- Nunca commitear `.env.local` ni credenciales.

## Cómo quiero que trabajes

- Si la consigna es ambigua, **preguntá antes de escribir código**. No inventes reglas de negocio.
- Cambios chicos y enfocados. No refactorices archivos que no tienen que ver con la tarea.
- Antes de crear un helper nuevo, buscá si ya existe uno en `lib/`.
- Cuando toques algo de seguridad o del modelo de datos, explicá el porqué del cambio: son las dos áreas que se revisan línea por línea.
- No consideres terminada una tarea si introduce errores. Antes de finalizar un cambio, debes verificar que `npm run typecheck`, `npm test` y `npm run build` se ejecuten sin errores.
