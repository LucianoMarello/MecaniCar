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

## Pruebas manuales

1. Como Cliente, desde `/vehiculos`, abrir "Registrar vehículo". Como Mecánico, abrir `/vehiculos/nuevo` a mano: 404.
2. Enviar vacío: error debajo de patente, marca y modelo. Año con letras: error debajo del año. Los demás campos conservan lo escrito.
3. Registrar una patente que ya existe, escrita en minúsculas y con espacios: mensaje arriba del formulario, sin errores de campo.
4. Registrar uno nuevo: lleva al detalle con la patente en mayúsculas; al volver al listado aparece sin recargar.
5. Apretar "Registrar vehículo" dos veces rápido: el botón pasa a "Guardando…" deshabilitado y se crea un solo vehículo.
6. Recorrer el formulario con Tab y Enter, sin mouse, y a 375 px.
7. En un teléfono real, contra producción y con datos móviles: anotar en el PR qué se vio que DevTools no mostró.
