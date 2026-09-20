# Contrato de la API REST — MecaniCar

Este documento define las operaciones HTTP ofrecidas por MecaniCar a partir de las historias de usuario, los roles y las reglas de negocio establecidas en `docs/spec.md`.

La API utiliza JSON para recibir y devolver información.

## Convenciones generales

- Todas las rutas comienzan con `/api`.
- Las rutas representan recursos mediante sustantivos en plural.
- Los datos recibidos se validan con Zod.
- La identidad y el rol del usuario deben obtenerse desde la sesión y nunca desde el body.
- Las operaciones privadas requieren autenticación.
- Los clientes solamente pueden acceder a recursos asociados a sus propios vehículos.
- Las respuestas de error utilizan el siguiente formato:

```json
{
  "error": "Descripción legible del problema"
}
```

## Códigos de respuesta generales

| Código | Significado |
|---|---|
| `200 OK` | Consulta o modificación realizada correctamente |
| `201 Created` | Recurso creado correctamente |
| `204 No Content` | Recurso eliminado correctamente |
| `400 Bad Request` | Datos de entrada inválidos |
| `401 Unauthorized` | No existe una sesión autenticada |
| `403 Forbidden` | El usuario no posee el rol o la propiedad requerida |
| `404 Not Found` | El recurso solicitado no existe |
| `409 Conflict` | La operación contradice el estado actual o una regla de negocio |
| `500 Internal Server Error` | Error inesperado del servidor |

---

## Vehículos

| Método y ruta | Qué hace | Rol | Respuesta exitosa | Errores |
|---|---|---|---|---|
| `POST /api/vehiculos` | Registra un vehículo asociado al cliente autenticado | Cliente | `201` con el vehículo creado | `400` datos inválidos; `401` sin sesión; `403` rol incorrecto; `409` patente duplicada |
| `GET /api/vehiculos` | Lista los vehículos propios del cliente o todos los vehículos para el mecánico | Cliente o Mecánico | `200` con la lista | `401` sin sesión |
| `GET /api/vehiculos/:id` | Consulta un vehículo propio o, para el mecánico, cualquier vehículo | Cliente o Mecánico | `200` con el vehículo | `401` sin sesión; `403` vehículo de otro cliente; `404` inexistente |
| `PATCH /api/vehiculos/:id` | Modifica un vehículo propio o, para el mecánico, cualquier vehículo | Cliente o Mecánico | `200` con el vehículo actualizado | `400` datos inválidos; `401` sin sesión; `403` vehículo de otro cliente; `404` inexistente; `409` patente duplicada |
| `DELETE /api/vehiculos/:id` | Da de baja un vehículo si no posee turnos ni órdenes asociados | Cliente o Mecánico | `204` sin contenido | `401` sin sesión; `403` vehículo de otro cliente; `404` inexistente; `409` vehículo con historial asociado |

---

## Turnos

| Método y ruta | Qué hace | Rol | Respuesta exitosa | Errores |
|---|---|---|---|---|
| `POST /api/turnos` | Solicita un turno para un vehículo del cliente | Cliente | `201` con el turno en estado `PENDIENTE` | `400` datos inválidos o fecha no futura; `401` sin sesión; `403` vehículo de otro cliente; `404` vehículo inexistente |
| `GET /api/turnos` | Lista los turnos permitidos para el usuario autenticado. El cliente recibe solamente sus turnos y el mecánico puede consultar los turnos del taller | Cliente o Mecánico | `200` con la lista | `401` sin sesión |
| `GET /api/turnos/:id` | Consulta un turno determinado | Cliente o Mecánico | `200` con el turno | `401` sin sesión; `403` turno de otro cliente; `404` inexistente |
| `POST /api/turnos/:id/confirmacion` | Confirma un turno pendiente | Mecánico | `200` con el turno en estado `CONFIRMADO` | `401` sin sesión; `403` rol incorrecto; `404` turno inexistente; `409` turno cancelado o no pendiente |
| `POST /api/turnos/:id/cancelacion` | Cancela un turno propio que todavía no generó una orden | Cliente | `200` con el turno en estado `CANCELADO` | `401` sin sesión; `403` turno de otro cliente; `404` inexistente; `409` ya está cancelado o ya generó una orden |

---

## Órdenes de trabajo

| Método y ruta | Qué hace | Rol | Respuesta exitosa | Errores |
|---|---|---|---|---|
| `POST /api/turnos/:id/ingreso` | Registra el ingreso del vehículo y crea una orden de trabajo | Mecánico | `201` con la orden en estado `ABIERTA` | `401` sin sesión; `403` rol incorrecto; `404` turno inexistente; `409` turno no confirmado, cancelado o con orden existente |
| `GET /api/ordenes-trabajo` | Lista las órdenes permitidas para el usuario. El cliente recibe las correspondientes a sus vehículos y el mecánico recibe las órdenes del taller | Cliente o Mecánico | `200` con la lista | `401` sin sesión |
| `GET /api/ordenes-trabajo/:id` | Consulta una orden de trabajo | Cliente o Mecánico | `200` con la orden | `401` sin sesión; `403` orden correspondiente a otro cliente; `404` inexistente |
| `POST /api/ordenes-trabajo/:id/finalizacion` | Finaliza una reparación que se encuentra en curso | Mecánico | `200` con la orden en estado `FINALIZADA` | `401` sin sesión; `403` rol incorrecto; `404` orden inexistente; `409` orden abierta, sin presupuesto aprobado o ya finalizada |

---

## Servicios

El catálogo de servicios constituye el CRUD completo requerido para el MVP.

| Método y ruta | Qué hace | Rol | Respuesta exitosa | Errores |
|---|---|---|---|---|
| `POST /api/servicios` | Crea un servicio en el catálogo | Mecánico | `201` con el servicio creado | `400` datos inválidos o precio menor o igual a cero; `401` sin sesión; `403` rol incorrecto |
| `GET /api/servicios` | Lista los servicios del catálogo | Mecánico | `200` con la lista | `401` sin sesión; `403` rol incorrecto |
| `GET /api/servicios/:id` | Consulta un servicio | Mecánico | `200` con el servicio | `401` sin sesión; `403` rol incorrecto; `404` inexistente |
| `PATCH /api/servicios/:id` | Modifica un servicio para presupuestos futuros | Mecánico | `200` con el servicio actualizado | `400` datos inválidos o precio menor o igual a cero; `401` sin sesión; `403` rol incorrecto; `404` inexistente |
| `DELETE /api/servicios/:id` | Elimina un servicio que no está siendo utilizado | Mecánico | `204` sin contenido | `401` sin sesión; `403` rol incorrecto; `404` inexistente; `409` servicio utilizado en un presupuesto |

---

## Presupuestos

| Método y ruta | Qué hace | Rol | Respuesta exitosa | Errores |
|---|---|---|---|---|
| `POST /api/presupuestos` | Crea un presupuesto para una orden utilizando uno o más servicios | Mecánico | `201` con el presupuesto en estado `PENDIENTE`, sus detalles y el total | `400` datos inválidos o sin servicios; `401` sin sesión; `403` rol incorrecto; `404` orden o servicio inexistente; `409` orden finalizada |
| `GET /api/presupuestos` | Lista los presupuestos permitidos para el usuario. El cliente recibe los correspondientes a sus vehículos y el mecánico recibe los presupuestos del taller | Cliente o Mecánico | `200` con la lista | `401` sin sesión |
| `GET /api/presupuestos/:id` | Consulta los servicios, precios aplicados, total y estado de un presupuesto | Cliente o Mecánico | `200` con el presupuesto | `401` sin sesión; `403` presupuesto correspondiente a otro cliente; `404` inexistente |
| `POST /api/presupuestos/:id/aprobacion` | Aprueba un presupuesto pendiente y pasa la orden asociada a `EN_REPARACION` | Cliente | `200` con el presupuesto aprobado y la orden actualizada | `401` sin sesión; `403` presupuesto de otro cliente; `404` inexistente; `409` presupuesto ya aprobado o rechazado |
| `POST /api/presupuestos/:id/rechazo` | Rechaza un presupuesto pendiente | Cliente | `200` con el presupuesto en estado `RECHAZADO` | `401` sin sesión; `403` presupuesto de otro cliente; `404` inexistente; `409` presupuesto ya aprobado o rechazado |

---

## Correspondencia con las historias de usuario

| Historia de usuario | Operación de la API |
|---|---|
| HU01 — Registrar vehículo | `POST /api/vehiculos` |
| HU02 — Solicitar turno | `POST /api/turnos` |
| HU03 — Consultar turnos | `GET /api/turnos` y `GET /api/turnos/:id` |
| HU04 — Confirmar turno | `POST /api/turnos/:id/confirmacion` |
| HU05 — Cancelar turno | `POST /api/turnos/:id/cancelacion` |
| HU06 — Registrar ingreso | `POST /api/turnos/:id/ingreso` |
| HU07 — Administrar servicios | CRUD de `/api/servicios` |
| HU08 — Crear presupuesto | `POST /api/presupuestos` |
| HU09 — Consultar presupuesto | `GET /api/presupuestos/:id` |
| HU10 — Aprobar presupuesto | `POST /api/presupuestos/:id/aprobacion` |
| HU11 — Rechazar presupuesto | `POST /api/presupuestos/:id/rechazo` |
| HU12 — Finalizar reparación | `POST /api/ordenes-trabajo/:id/finalizacion` |
| HU13 — Consultar estado de reparación | `GET /api/ordenes-trabajo/:id` |

---

## Implementación mínima de la Clase 4

Durante la Clase 4 se implementará:

- El CRUD completo de servicios.
- El listado de turnos filtrado según el usuario autenticado.
- La aprobación de un presupuesto como operación principal que no es un ABM.
- El acceso a datos exclusivamente mediante archivos ubicados en `lib/db/`.
- La validación de entradas mediante los schemas de Zod.
- Los casos de prueba HTTP dentro de `docs/api.http`.

La autenticación y determinadas reglas de negocio se completarán en clases posteriores. Mientras tanto, deberán quedar identificadas en el código mediante comentarios explícitos:

```ts
// TODO (clase 5): validar regla de negocio pendiente.
// TODO (clase 6): obtener identidad y rol desde la sesión.
```

MecaniCar no posee actualmente un recurso que deba exponerse mediante un `GET` público.

Hasta implementar la sesión real, `DEMO_ROLE=CLIENTE` utiliza el cliente de demostración y
`DEMO_ROLE=MECANICO` permite verificar los listados y permisos del mecánico. Esta selección
es exclusivamente temporal y deberá eliminarse en la Clase 6.
