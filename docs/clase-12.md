# Clase 12 — formularios y mutaciones

## Base compartida

- `lib/formularios.ts`: `EstadoFormulario`, lo que toda Server Action le devuelve a su formulario. `errores` son de validación (Zod) y se muestran debajo de cada campo; `mensaje` es un rechazo de regla de negocio y va arriba del formulario; `valores` vuelve a pintar lo escrito para que el formulario no se vacíe al fallar.
- `components/Campo.tsx`: etiqueta, control, ayuda y error conectados con `htmlFor`, `aria-describedby` y `aria-invalid`. Los ids salen de `useId()`.

## Alta de vehículo (HU01) — `/vehiculos/nuevo`

- `page.tsx` (servidor): sin sesión va a `/ingresar`; Mecánico y Administrador reciben 404, porque registrar vehículos es del cliente.
- `acciones.ts` (`"use server"`): es un endpoint público, así que repite el orden de los Route Handlers: sesión y rol, validación con `vehiculoSchema` (el mismo de `POST /api/vehiculos`), regla de patente única con `crearVehiculo`, escritura con el id de la sesión, `revalidatePath("/vehiculos")` y redirección al detalle.
- `FormularioVehiculo.tsx` (cliente): `useActionState` para los errores y `pendiente` para deshabilitar el botón mientras guarda.
- El listado ofrece "Registrar vehículo" y la lista vacía ofrece "Registrar mi primer vehículo", solo al cliente.
- La patente se normaliza en el schema (mayúsculas, sin espacios, RN02). Como `PATCH` usa el mismo schema, también aplica al editar.
- Si dos altas con la misma patente llegan a la vez, la segunda choca con el índice único: `crearVehiculo` lo informa como patente duplicada en vez de un error 500.

## Turnos (HU02 y HU03) — `/turnos/nuevo`, `/turnos`, `/turnos/[id]`

- `/turnos/nuevo` sigue el mismo patrón que el alta de vehículo. El vehículo se elige de un `NativeSelect` con los vehículos propios (`?vehiculo=` lo preselecciona solo si es uno de ellos) y `crearTurno` vuelve a verificar que sea del cliente de la sesión (RN05). Sin vehículos, la pantalla ofrece registrar uno.
- **Select y errores seguidos:** al terminar la acción, React reinicia el formulario con el `defaultValue` de cada campo. En un input o un textarea ese valor se actualiza, pero un `<select>` solo lo lee al montarse, así que volvía a "Elegí un vehículo". El select lleva como `key` el vehículo elegido: si cambia, se vuelve a montar con el valor nuevo.
- **Zona horaria:** `datetime-local` manda la hora sin zona y Vercel corre en UTC. `fechaHoraArgentina` (en `lib/formularios.ts`) la interpreta como hora de Buenos Aires (UTC-3) antes de validar con `turnoSchema`, que sigue exigiendo una fecha futura (RN06).
- `turnoSchema` pasó a explicar en castellano la falta de vehículo y de fecha, también para la API.
- `/turnos` y `/turnos/[id]` reutilizan `listarTurnos` y `buscarTurno`, las mismas consultas que la API: el cliente ve los suyos y el taller todos. Un turno ajeno o inexistente da el mismo 404. Por ahora el detalle es solo de lectura: confirmar, cancelar y registrar ingreso llegan en el PR siguiente.
- La barra suma "Mis turnos" / "Turnos del taller", y el detalle del vehículo ofrece "Solicitar turno para este vehículo" al cliente.
- `components/ui/native-select.tsx` y `textarea.tsx` salen de shadcn y se ajustaron como `Input`: 44 px de alto, letra de 16 px en el teléfono y contorno de foco visible.

## Pruebas manuales

1. Como Cliente, desde `/vehiculos`, abrir "Registrar vehículo". Como Mecánico, abrir `/vehiculos/nuevo` a mano: 404.
2. Enviar vacío: error debajo de patente, marca y modelo. Año con letras: error debajo del año. Los demás campos conservan lo escrito. Corregir algunos y volver a enviar con un error: solo queda ese error y no se borra nada.
3. Registrar una patente que ya existe, escrita en minúsculas y con espacios: mensaje arriba del formulario, sin errores de campo.
4. Registrar uno nuevo: lleva al detalle con la patente en mayúsculas; al volver al listado aparece sin recargar.
5. Apretar "Registrar vehículo" dos veces rápido: el botón pasa a "Guardando…" deshabilitado y se crea un solo vehículo.
6. Recorrer el formulario con Tab y Enter, sin mouse, y a 375 px.
7. En un teléfono real, contra producción y con datos móviles: anotar en el PR qué se vio que DevTools no mostró.
8. Turnos, como Cliente: desde el detalle de un vehículo, "Solicitar turno para este vehículo" llega con el vehículo elegido. Enviar sin fecha y con un motivo corto: errores debajo de cada campo. Cambiar de vehículo, corregir el motivo y volver a enviar con una fecha pasada: el select sigue con el vehículo nuevo y el motivo no se borra. Pedir un turno a las 09:30: el detalle muestra 09:30, no 06:30 ni 12:30.
9. El nuevo turno aparece en "Mis turnos" sin recargar. Otro cliente que abre su URL recibe el 404 de turnos. El taller lo ve en "Turnos del taller".
