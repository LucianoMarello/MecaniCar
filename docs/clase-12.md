# Clase 12 — formularios y mutaciones

## Base compartida

- `lib/formularios.ts`: `EstadoFormulario`, lo que toda Server Action le devuelve a su formulario. `errores` son de validación (Zod) y se muestran debajo de cada campo; `mensaje` es un rechazo de regla de negocio y va arriba del formulario; `valores` vuelve a pintar lo escrito para que el formulario no se vacíe al fallar.
- `components/Campo.tsx`: etiqueta, control, ayuda y error conectados con `htmlFor`, `aria-describedby` y `aria-invalid`. Los ids salen de `useId()`.

## Alta de vehículo (HU01) — `/vehiculos/nuevo`

- `page.tsx` (servidor): sin sesión va a `/ingresar`; Mecánico y Administrador reciben 404, porque registrar vehículos es del cliente.
- `acciones.ts` (`"use server"`): es un endpoint público, así que repite el orden de los Route Handlers: sesión y rol, validación con `vehiculoSchema` (el mismo de `POST /api/vehiculos`), regla de patente única con `crearVehiculo`, escritura con el id de la sesión, `revalidatePath("/vehiculos")` y redirección al detalle.
- `FormularioVehiculo.tsx` (cliente): `useActionState` para los errores y `pendiente` para deshabilitar el botón mientras guarda.
- El listado ofrece "Registrar vehículo" y la lista vacía ofrece "Registrar mi primer vehículo", solo al cliente.
- La patente se normaliza en el schema (mayúsculas, sin espacios ni guiones) y solo admite letras y números (RN02). Como `PATCH` usa el mismo schema, también aplica al editar.
- Si dos altas con la misma patente llegan a la vez, la segunda choca con el índice único: `crearVehiculo` lo informa como patente duplicada en vez de un error 500.

## Turnos (HU02 y HU03) — `/turnos/nuevo`, `/turnos`, `/turnos/[id]`

- `/turnos/nuevo` sigue el mismo patrón que el alta de vehículo. El vehículo se elige de un `NativeSelect` con los vehículos propios (`?vehiculo=` lo preselecciona solo si es uno de ellos) y `crearTurno` vuelve a verificar que sea del cliente de la sesión (RN05). Sin vehículos, la pantalla ofrece registrar uno.
- **Select y errores seguidos:** al terminar la acción, React reinicia el formulario con el `defaultValue` de cada campo. En un input o un textarea ese valor se actualiza, pero un `<select>` solo lo lee al montarse, así que volvía a "Elegí un vehículo". El select lleva como `key` el vehículo elegido: si cambia, se vuelve a montar con el valor nuevo.
- **Zona horaria:** `datetime-local` manda la hora sin zona y Vercel corre en UTC. `fechaHoraArgentina` (en `lib/formularios.ts`) la interpreta como hora de Buenos Aires (UTC-3) antes de validar con `turnoSchema`, que sigue exigiendo una fecha futura (RN06).
- `turnoSchema` pasó a explicar en castellano la falta de vehículo y de fecha, también para la API.
- `/turnos` y `/turnos/[id]` reutilizan `listarTurnos` y `buscarTurno`, las mismas consultas que la API: el cliente ve los suyos y el taller todos. Un turno ajeno o inexistente da el mismo 404. Los botones de confirmar, cancelar y registrar ingreso se explican en la sección siguiente.
- La barra suma "Mis turnos" / "Turnos del taller", y el detalle del vehículo ofrece "Solicitar turno para este vehículo" al cliente.
- "Mis vehículos", la pantalla principal del cliente, ofrece "Solicitar turno" como acción principal y "Registrar vehículo" al lado: así el turno se pide con un solo clic (spec 8.1).
- `/turnos` y `/turnos/[id]` tienen su `loading.tsx`, con esqueletos propios (`CargandoTurnos`, `CargandoDetalleTurno`) como los de vehículos.
- `components/ui/native-select.tsx` y `textarea.tsx` salen de shadcn y se ajustaron como `Input`: 44 px de alto, letra de 16 px en el teléfono y contorno de foco visible.

## Acciones del turno (HU04, HU05, HU06) — `/turnos/[id]`

- **Qué ve cada uno.** `page.tsx` decide qué botones mostrar. Mecánico y Administrador ven "Confirmar turno" si el turno está `PENDIENTE`, y "Registrar ingreso" si está `CONFIRMADO` y sin orden. El cliente ve "Cancelar turno" si su turno está `PENDIENTE` o `CONFIRMADO` y sin orden. El mecánico no cancela: la spec (2.2) lo deja para más adelante. Esconder un botón es solo cortesía, porque la acción vuelve a verificar todo.
- **`acciones.ts`** (`"use server"`): tres acciones con el orden de los Route Handlers. Primero, sesión y rol en la primera línea. Después, el id con `idSchema`: uno inválido recibe el mismo mensaje que uno inexistente. Por último, el caso de `lib/casos/turnos.ts`, el mismo que usa la API, así que la regla no se repite. Cancelar le pasa al caso el `usuarioId` de la sesión: un turno ajeno da "El turno no existe.".
- **Por qué `.bind()`.** El botón no tiene campos: el turno sale de la URL, que la página ya validó, y quién lo pide sale de la sesión. `AccionesTurno` ata el id con `confirmarTurnoAction.bind(null, turnoId)`, como `emitir.tsx` en el proyecto del profe. Así el id no es un campo del formulario, ni siquiera uno oculto que se edita con el inspector, y la acción ni declara el `formData`. Igual, `.bind()` no lo vuelve secreto: el id viaja como argumento en el pedido y alguien puede cambiarlo. Por eso la acción lo valida y el caso vuelve a verificar el acceso.
- **Por qué no se redirige a la misma URL.** En el proyecto del profe, `redirect` a la pantalla en la que ya estaba la persona a veces dejaba sin terminar la transición de `useActionState`, y el botón quedaba trabado en "Emitiendo…" (commit 36d492a). `revalidatePath` ya trae la pantalla nueva del servidor. Por eso confirmar y cancelar revalidan `/turnos` y `/turnos/[id]` y devuelven el estado. Registrar el ingreso sí redirige, porque lleva a otra pantalla: la orden recién creada. `redirect` funciona lanzando una excepción, así que va al final y fuera de cualquier `try`.
- **Un estado por acción, todos en `AccionesTurno`.** Después de revalidar, el botón que se apretó puede desaparecer (un turno confirmado ya no ofrece "Confirmar"). Como el estado vive en el componente de arriba y no en el botón, el mensaje o el aviso siguen a la vista.
- **Rechazos y conflictos.** Un rechazo de regla (`RECHAZADO`) muestra los motivos arriba de los botones, en un `Alert` con `role="alert"`. Si otro pedido cambió el turno en el medio, el caso lanza `ConflictoNegocio`, P2034 o P2002, y la acción responde "El turno cambió mientras se procesaba. Actualizá la página e intentá de nuevo.", el mismo texto que finalizar una orden. Cualquier otro error se relanza y lo muestra `error.tsx`.
- **El diálogo de cancelar.** `components/ui/alert-dialog.tsx` sale de la CLI de shadcn. Sus botones usan nuestro `Button`, así que ya tienen 44 px de alto y el contorno de foco; a la CLI se le contestó que no pisara `button.tsx`. "Sí, cancelar turno" es un botón `submit` común y no un `AlertDialogAction`, porque este cierra el diálogo, y con él el formulario, antes de enviarlo. Mientras cancela, el botón dice "Cancelando…" y ni Esc ni "Volver" cierran el diálogo. Con la respuesta se cierra: un rechazo queda arriba, a la vista, y el foco vuelve a "Cancelar turno".
- **El aviso que no salió (spec 9.4).** Si el correo de confirmación falla, el turno queda confirmado igual y la acción devuelve `aviso` en `EstadoFormulario`. La pantalla lo muestra arriba de los botones con el mismo `Alert` que finalizar una orden: "El turno se confirmó, pero el aviso no pudo enviarse". No se usa `?aviso=pendiente`, porque para eso habría que redirigir a la misma URL. Esa forma queda para las acciones que llevan a otra pantalla (AGENTS.md), como crear un presupuesto.
- **El ingreso enlaza a la orden.** Si el turno ya tiene orden, la fila "Ingreso al taller" ofrece "Ver orden de trabajo". El cliente también puede abrirla (HU13).

## Pruebas manuales

1. Como Cliente, desde `/vehiculos`, abrir "Registrar vehículo". Como Mecánico, abrir `/vehiculos/nuevo` a mano: 404.
2. Enviar vacío: error debajo de patente, marca y modelo. Año con letras: error debajo del año. Los demás campos conservan lo escrito. Corregir algunos y volver a enviar con un error: solo queda ese error y no se borra nada.
3. Registrar una patente que ya existe, escrita en minúsculas y con espacios: mensaje arriba del formulario, sin errores de campo.
4. Registrar uno nuevo: lleva al detalle con la patente en mayúsculas; al volver al listado aparece sin recargar.
5. Apretar "Registrar vehículo" dos veces rápido: el botón pasa a "Guardando…" deshabilitado y se crea un solo vehículo.
6. Recorrer el formulario con Tab y Enter, sin mouse, y a 375 px.
7. En un teléfono real, contra producción y con datos móviles: anotar en el PR qué se vio que DevTools no mostró.
8. Turnos, como Cliente: en "Mis vehículos", "Solicitar turno" abre el formulario de un solo clic. Desde el detalle de un vehículo, "Solicitar turno para este vehículo" llega con el vehículo elegido. Enviar sin fecha y con un motivo corto: errores debajo de cada campo. Cambiar de vehículo, corregir el motivo y volver a enviar con una fecha pasada: el select sigue con el vehículo nuevo y el motivo no se borra. Pedir un turno a las 09:30: el detalle muestra 09:30, no 06:30 ni 12:30.
9. El nuevo turno aparece en "Mis turnos" sin recargar. Otro cliente que abre su URL recibe el 404 de turnos. El taller lo ve en "Turnos del taller".
10. Botones del turno, sin escribir: como Cliente, en un turno propio `PENDIENTE`, solo aparece "Cancelar turno". Como Mecánico, en un `PENDIENTE` solo aparece "Confirmar turno", en un `CONFIRMADO` sin orden solo "Registrar ingreso", y nunca "Cancelar turno".
11. Con teclado: llegar a cada botón con Tab y apretarlo con Enter. "Cancelar turno" abre el diálogo; Esc lo cierra y el foco vuelve a "Cancelar turno". A 375 px los botones quedan apilados y a lo ancho, sin scroll horizontal.
12. Como Mecánico, confirmar un turno de prueba con doble clic rápido: el botón pasa a "Confirmando…" y la pantalla sigue en el detalle, ahora `CONFIRMADO` y con "Registrar ingreso". En la base queda un solo cambio y sale un solo correo, que llega a `RESEND_TEST_RECIPIENT`.
13. Volver a confirmar desde otra pestaña que quedó con el turno `PENDIENTE`: el rechazo aparece arriba de los botones.
14. "Registrar ingreso" lleva a la orden nueva. Al volver al turno, "Ingreso al taller" enlaza a "Ver orden de trabajo".
15. Como Cliente, pedir otro turno de prueba y cancelarlo desde el diálogo: queda `CANCELADO` y sin botones.
16. Aviso de correo (9.4): en local y sin `RESEND_API_KEY`, confirmar un turno muestra arriba "El turno se confirmó, pero el aviso no pudo enviarse", y el turno queda `CONFIRMADO`.
