# Contrato de la API REST — MecaniCar

Este documento define las operaciones HTTP ofrecidas por MecaniCar a partir de las historias de usuario, los roles y las reglas de negocio establecidas en `docs/spec.md`.

La API utiliza JSON para recibir y devolver información.

## Convenciones generales

- Todas las rutas comienzan con `/api`.
- Las rutas representan recursos mediante sustantivos en plural.
- Los datos recibidos se validan con Zod.
- La identidad y el rol del usuario se obtienen desde la sesión y nunca desde el body.
- Todas las operaciones requieren autenticación. La sesión se inicia con Google (ver [Autenticación](#autenticación)).
- Donde una tabla dice "Mecánico", también puede operar el Administrador. Las operaciones marcadas solo como "Cliente" responden `403` a los otros dos roles.
- Los clientes solamente pueden acceder a recursos asociados a sus propios vehículos. Un recurso ajeno responde `404`, igual que uno inexistente, para no revelar que existe.
- En las operaciones con body, los datos se validan antes de verificar la sesión (salvo en `/api/usuarios`): un body inválido responde `400` aunque no haya sesión.
- Las listas de vehículos, turnos, órdenes, servicios y presupuestos devuelven como máximo 100 elementos.
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
| `400 Bad Request` | Datos de entrada inválidos o body que no es JSON |
| `401 Unauthorized` | No existe una sesión autenticada |
| `403 Forbidden` | El usuario no posee el rol requerido |
| `404 Not Found` | El recurso solicitado no existe o pertenece a otro cliente |
| `409 Conflict` | La operación contradice el estado actual o una regla de negocio |
| `500 Internal Server Error` | Error inesperado del servidor |

---

## Errores, en detalle

Este catálogo vincula los casos de error de la especificación con la capa que los resuelve. Las reglas de estado se resuelven en funciones puras (`lib/turnos.ts`, `lib/ordenes.ts` y `lib/presupuestos.ts`), cada una con sus tests.

| Operación | Situación | Origen | Capa | Status | Mensaje |
|---|---|---|---|---|---|
| `POST /api/vehiculos` | La patente ya está registrada | HU01 / RN02 | Base | `409` | `La patente ya está registrada` |
| `DELETE /api/vehiculos/:id` | El vehículo posee turnos u órdenes asociados | RN03 | Regla | `409` | `El vehículo tiene turnos u órdenes asociados` |
| `POST /api/turnos` | La fecha y hora no son futuras | HU02 / RN06 | Zod | `400` | `Datos inválidos` |
| `POST /api/turnos/:id/confirmacion` | El turno no está pendiente | HU04 / RN09 | Regla | `409` | `Solo puede confirmarse un turno pendiente` |
| `POST /api/turnos/:id/cancelacion` | El turno ya está cancelado | HU05 / RN32 | Regla | `409` | `El turno ya se encuentra cancelado` |
| `POST /api/turnos/:id/cancelacion` | El turno ya generó una orden | HU05 / RN10 | Regla | `409` | `No se puede cancelar un turno que ya ingresó al taller (tiene orden de trabajo)` |
| `POST /api/turnos/:id/ingreso` | El turno no está confirmado | HU06 / RN31 | Regla | `409` | `El turno debe estar CONFIRMADO para registrar el ingreso` |
| `POST /api/turnos/:id/ingreso` | El turno ya posee una orden | HU06 / RN12 / RN31 | Regla | `409` | `Este turno ya tiene una orden de trabajo asociada` |
| `DELETE /api/servicios/:id` | El servicio está incluido en un presupuesto | HU07 / RN33 | Base | `409` | `El servicio está incluido en un presupuesto` |
| `POST /api/presupuestos` | No se seleccionó ningún servicio | HU08 / RN21 | Zod | `400` | `Datos inválidos` |
| `POST /api/presupuestos` | La orden ya está finalizada | RN16 | Regla | `409` | `No se puede presupuestar una orden finalizada` |
| `POST /api/presupuestos/:id/aprobacion` | El presupuesto no está pendiente | HU10 / RN26 / RN29 | Regla | `409` | `Solamente puede aprobarse un presupuesto pendiente` |
| `POST /api/presupuestos/:id/rechazo` | El presupuesto no está pendiente | HU11 / RN26 / RN28 | Regla | `409` | `Solo puede rechazarse un presupuesto pendiente` |
| `POST /api/ordenes-trabajo/:id/finalizacion` | La orden no está en reparación | HU12 / RN15 / RN16 | Regla | `409` | `La orden debe estar EN_REPARACION para poder finalizarse` |
| `POST /api/ordenes-trabajo/:id/finalizacion` | La orden no posee un presupuesto aprobado | HU12 / RN14 | Regla | `409` | `La orden no tiene ningún presupuesto aprobado` |
| `PATCH /api/usuarios/:id/rol` | El administrador intenta cambiar su propio rol | RN36 | Regla | `409` | `El administrador no puede modificar su propio rol` |

Los errores de sesión (`401`, mensaje `No autenticado`) y de rol (`403`, mensaje `No autorizado`) son iguales en todas las operaciones: los resuelve `requerirUsuario` en `lib/auth.ts`.

---

## Vehículos

| Método y ruta | Qué hace | Rol | Respuesta exitosa | Errores |
|---|---|---|---|---|
| `POST /api/vehiculos` | Registra un vehículo asociado al cliente autenticado | Cliente | `201` con el vehículo creado | `400` datos inválidos; `401` sin sesión; `403` rol incorrecto; `409` patente duplicada |
| `GET /api/vehiculos` | Lista los vehículos propios del cliente o todos los vehículos para el mecánico | Cliente o Mecánico | `200` con la lista | `401` sin sesión |
| `GET /api/vehiculos/:id` | Consulta un vehículo propio o, para el mecánico, cualquier vehículo | Cliente o Mecánico | `200` con el vehículo | `401` sin sesión; `404` inexistente o de otro cliente |
| `PATCH /api/vehiculos/:id` | Modifica un vehículo propio o, para el mecánico, cualquier vehículo | Cliente o Mecánico | `200` con el vehículo actualizado | `400` datos inválidos; `401` sin sesión; `404` inexistente o de otro cliente; `409` patente duplicada |
| `DELETE /api/vehiculos/:id` | Da de baja un vehículo si no posee turnos ni órdenes asociados | Cliente o Mecánico | `204` sin contenido | `401` sin sesión; `404` inexistente o de otro cliente; `409` vehículo con historial asociado |

---

## Turnos

| Método y ruta | Qué hace | Rol | Respuesta exitosa | Errores |
|---|---|---|---|---|
| `POST /api/turnos` | Solicita un turno para un vehículo del cliente | Cliente | `201` con el turno en estado `PENDIENTE` | `400` datos inválidos o fecha no futura; `401` sin sesión; `403` rol incorrecto; `404` vehículo inexistente o de otro cliente |
| `GET /api/turnos` | Lista los turnos permitidos para el usuario autenticado. El cliente recibe solamente sus turnos y el mecánico puede consultar los turnos del taller | Cliente o Mecánico | `200` con la lista | `401` sin sesión |
| `GET /api/turnos/:id` | Consulta un turno determinado | Cliente o Mecánico | `200` con el turno | `401` sin sesión; `404` inexistente o de otro cliente |
| `POST /api/turnos/:id/confirmacion` | Confirma un turno pendiente | Mecánico | `200` con el turno en estado `CONFIRMADO` | `401` sin sesión; `403` rol incorrecto; `404` turno inexistente; `409` turno cancelado o no pendiente |
| `POST /api/turnos/:id/cancelacion` | Cancela un turno propio que todavía no generó una orden | Cliente | `200` con el turno en estado `CANCELADO` | `401` sin sesión; `403` rol incorrecto; `404` inexistente o de otro cliente; `409` ya está cancelado o ya generó una orden |

---

## Órdenes de trabajo

| Método y ruta | Qué hace | Rol | Respuesta exitosa | Errores |
|---|---|---|---|---|
| `POST /api/turnos/:id/ingreso` | Registra el ingreso del vehículo y crea una orden de trabajo | Mecánico | `201` con la orden en estado `ABIERTA` | `401` sin sesión; `403` rol incorrecto; `404` turno inexistente; `409` turno no confirmado, cancelado o con orden existente |
| `GET /api/ordenes-trabajo` | Lista las órdenes permitidas para el usuario. El cliente recibe las correspondientes a sus vehículos y el mecánico recibe las órdenes del taller | Cliente o Mecánico | `200` con la lista | `401` sin sesión |
| `GET /api/ordenes-trabajo/:id` | Consulta una orden de trabajo | Cliente o Mecánico | `200` con la orden | `401` sin sesión; `404` inexistente o de otro cliente |
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
| `GET /api/presupuestos/:id` | Consulta los servicios, precios aplicados, total y estado de un presupuesto | Cliente o Mecánico | `200` con el presupuesto | `401` sin sesión; `404` inexistente o de otro cliente |
| `POST /api/presupuestos/:id/aprobacion` | Aprueba un presupuesto pendiente y pasa la orden asociada a `EN_REPARACION` | Cliente | `200` con el presupuesto aprobado y la orden actualizada | `401` sin sesión; `403` rol incorrecto; `404` inexistente o de otro cliente; `409` presupuesto ya aprobado o rechazado |
| `POST /api/presupuestos/:id/rechazo` | Rechaza un presupuesto pendiente | Cliente | `200` con el presupuesto en estado `RECHAZADO` | `401` sin sesión; `403` rol incorrecto; `404` inexistente o de otro cliente; `409` presupuesto ya aprobado o rechazado |

---

## Usuarios

Permiten que el Administrador dé de alta a los mecánicos (sección 2.3 de `docs/spec.md`).

| Método y ruta | Qué hace | Rol | Respuesta exitosa | Errores |
|---|---|---|---|---|
| `GET /api/usuarios` | Lista los usuarios registrados con su rol | Administrador | `200` con la lista | `401` sin sesión; `403` rol incorrecto |
| `PATCH /api/usuarios/:id/rol` | Asigna a otro usuario el rol `CLIENTE` o `MECANICO`. Body: `{ "rol": "MECANICO" }` | Administrador | `200` con el usuario actualizado | `400` rol distinto de `CLIENTE` o `MECANICO`; `401` sin sesión; `403` rol incorrecto; `404` usuario inexistente; `409` intenta cambiar su propio rol |

El cambio de rol se aplica en el siguiente request del usuario afectado, sin que tenga que volver a iniciar sesión.

---

## Avisos por correo

Tres operaciones le envían un correo al cliente mediante Resend, **después** de completarse. La decisión y el detalle están en la sección 9 de `docs/spec.md`.

| Operación | Aviso al cliente |
|---|---|
| `POST /api/turnos/:id/confirmacion` | El turno fue confirmado |
| `POST /api/presupuestos` | Hay un presupuesto disponible |
| `POST /api/ordenes-trabajo/:id/finalizacion` | El vehículo está listo para retirar |

El servicio es accesorio, así que **no agrega ningún código de error al contrato**: si Resend falla, rechaza el envío o tarda más de 5 segundos, la operación responde igual (`200` o `201`) y la falla queda en el log del servidor. La prueba está al final de `docs/api.http`.

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

## Autenticación

El inicio de sesión se hace con una cuenta de Google, mediante Auth.js. La decisión está en `docs/adr/0003-identidad-y-sesion.md`.

| Ruta | Para qué |
|---|---|
| `GET /api/auth/signin` | Página para iniciar sesión con Google |
| `GET /api/auth/session` | Devuelve el usuario de la sesión actual, con su rol |
| `GET /api/auth/signout` | Página para cerrar la sesión |

Estas rutas las provee Auth.js; no forman parte de los recursos del negocio.

La sesión viaja en una cookie que el navegador envía sola. Para probar la API desde Postman hay que iniciar sesión en el navegador y copiar esa cookie en el request: se llama `authjs.session-token` en local y `__Secure-authjs.session-token` en producción.

MecaniCar no expone ningún recurso mediante un `GET` público.
