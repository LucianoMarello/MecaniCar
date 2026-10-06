# ADR 0002 — Base de datos y modelo de datos

**Estado:** aceptada
**Fecha:** 2026-09-08 (redactado el 2026-10-04)
**Decide:** equipo

---

## Contexto

MecaniCar guarda una cadena de datos que dependen unos de otros: un cliente tiene vehículos, un vehículo tiene turnos, un turno puede generar una orden de trabajo, una orden tiene presupuestos y cada presupuesto tiene detalles que apuntan a un servicio del catálogo (`docs/spec.md`, secciones 3 y 4).

Varias reglas de negocio son restricciones sobre esos datos: la patente es única (RN02), un turno genera como máximo una orden (RN12) y el precio de un presupuesto no cambia aunque cambie el catálogo (RN23 y RN24).

La cátedra ofrecía dos caminos, Postgres o MongoDB, los dos con Prisma. Ningún integrante tenía experiencia previa con ninguno.

## Opciones consideradas

| Opción | A favor | En contra |
|---|---|---|
| Postgres (Supabase) | Las relaciones y las restricciones de unicidad las hace cumplir la base. Tiene transacciones. Es la primera recomendación de la cátedra y la que usa el proyecto de referencia | Cada cambio del modelo necesita una migración |
| MongoDB (Atlas) | No exige definir el esquema por adelantado | Las relaciones entre documentos las tendría que cuidar nuestro código |

MongoDB no llegó a discutirse en el equipo: sin experiencia en ninguna de las dos, se siguió la recomendación de la cátedra. Queda en la tabla porque era la alternativa disponible.

## Decisión

Elegimos **Postgres, alojado en Supabase, con Prisma**.

Porque los datos del taller son relacionales y era la opción recomendada para un equipo sin experiencia previa.

Sobre esa base, el modelo (`prisma/schema.prisma`) toma estas decisiones:

1. **Las reglas que se pueden expresar como restricción viven en la base.** `Vehiculo.patente` es única; `OrdenTrabajo.turnoId` es único, y eso es lo que garantiza una sola orden por turno; un mismo servicio no puede repetirse dentro de un presupuesto (`@@unique([presupuestoId, servicioId])`).
2. **Las claves primarias son identificadores generados (`cuid`).** La patente no se usa como clave: es un dato del negocio que puede cargarse mal y tener que corregirse.
3. **`DetallePresupuesto` es una tabla propia.** Resuelve la relación muchos a muchos entre presupuesto y servicio, y guarda `precioAplicado`: una copia del precio del servicio al momento de presupuestar.
4. **El total del presupuesto no se guarda.** Se calcula sumando los detalles (RN25), así no puede quedar distinto de lo que suman.
5. **Los importes son `Decimal`.** Un `Float` pierde precisión con los centavos.
6. **Los estados son enumerados de la base** (`EstadoTurno`, `EstadoOrdenTrabajo`, `EstadoPresupuesto`, `Rol`): no puede guardarse un valor que no exista.
7. **Aprobar un presupuesto es una transacción.** Cambian el presupuesto y la orden juntos, o no cambia ninguno (`marcarPresupuestoAprobado` en `lib/db/presupuestos.ts`).
8. **Hay dos conexiones a la base.** `DATABASE_URL` pasa por el pooler de Supabase y la usa la aplicación, porque en Vercel cada request puede abrir una conexión nueva; `DIRECT_URL` es la conexión directa y la usan las migraciones.

## Consecuencias

- La base rechaza por sí sola una patente duplicada o una segunda orden para el mismo turno, aunque el código tenga un error.
- Cambiar el modelo requiere una migración, y aplicarla sobre producción es un paso delicado. Por eso las mejoras de abajo no se hicieron antes del Parcial I.
- Un presupuesto conserva sus precios, pero el nombre del servicio se lee del catálogo: si un servicio se renombra, los presupuestos viejos muestran el nombre nuevo.

### Puntos conocidos, pendientes de mejora

- **Año del vehículo.** `Vehiculo.anio` es obligatorio en la base y opcional en el formulario. Si no se informa, se guarda el año actual (`crearVehiculo` en `lib/db/vehiculos.ts`), que es un dato inventado. Lo correcto sería permitir que quede vacío.
- **Índices faltantes.** `DetallePresupuesto.servicioId` no tiene índice. `Presupuesto.ordenTrabajoId` tiene un índice único. Con el volumen actual no se nota; habría que agregarlos si crecen los datos.
- **`onDelete` sin declarar.** Ninguna relación indica qué pasa al borrar. Vale el comportamiento por defecto de Prisma para relaciones obligatorias, que impide borrar un registro con datos asociados. Es lo que el sistema necesita (RN03 y RN33), pero está implícito y debería quedar escrito en el schema.
- **Datos repetidos.** `OrdenTrabajo.vehiculoId` puede obtenerse a través del turno, y `Turno.usuarioId` a través del vehículo. Simplifican las consultas, pero nada impide que queden desincronizados si algún día un vehículo cambia de dueño.

Actualización 2026-10-05: ordenTrabajoId es único en Presupuesto. El índice parcial Usuario_admin_unico limita a un Administrador. Las mutaciones de presupuesto y la finalización usan transacciones Serializable; los conflictos se devuelven como 409.

El índice parcial `Usuario_admin_unico` se administra mediante SQL porque Prisma 6 no lo representa en el schema. Antes de aplicar una futura migración, generarla con `prisma migrate dev --create-only` y revisar que no incluya `DROP INDEX "Usuario_admin_unico"`. No modificar migraciones ya aplicadas.
