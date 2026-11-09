# ADR 0004 — Casos de uso y escrituras protegidas

**Estado:** aceptada
**Fecha:** 2026-11-09
**Decide:** Luciano, con la revisión de Pedro en la #24

---

## Contexto

Confirmar un turno (HU04), cancelarlo (HU05) y registrar el ingreso del vehículo (HU06) siguen la misma secuencia: leer el turno, aplicar la regla de `lib/turnos.ts`, escribir y, al confirmar, avisarle al cliente por correo. Hasta la clase 12, esa secuencia "leer → regla → escribir → avisar" vivía dentro de cada Route Handler de `app/api/turnos/[id]/`. La clase 12 sumó una segunda puerta, la Server Action del detalle del turno, que la iba a duplicar. Dos copias de la misma regla terminan diciendo cosas distintas.

En la revisión de la #24, Pedro marcó además tres carreras. Entre leer el turno y escribirlo, otro pedido podía cambiarlo:

1. **Confirmar contra cancelar:** una confirmación podía pisar una cancelación y mandar un correo equivocado.
2. **Cancelar contra registrar el ingreso:** podía quedar una orden de trabajo para un turno cancelado.
3. **Confirmar dos veces:** dos pedidos simultáneos podían confirmar el mismo turno y mandar dos correos.

Había tres restricciones: no cambiar el contrato de la API (status, cuerpos y mensajes), mantener puro `lib/turnos.ts` (sin base ni correo) y dejar en `lib/db/` solo el acceso a la base (AGENTS.md).

## Opciones consideradas

**Dónde vive la secuencia**

| Opción | A favor | En contra |
|---|---|---|
| En cada puerta (Route Handler y Server Action) | No suma archivos | La regla se copia, y la próxima puerta la vuelve a copiar |
| En `lib/db/` | Queda al lado de las consultas | Mezcla las consultas con la regla y con el envío del correo |
| En `lib/turnos.ts`, junto a las reglas puras | Todo lo de turnos en un archivo | Deja de ser puro: sus tests necesitarían simular la base y el correo |
| En `lib/casos/turnos.ts` | Una sola secuencia para las dos puertas, y cada capa sigue haciendo una cosa | Una capa más para recorrer al leer el código |

**Cómo se devuelven los motivos de un rechazo**

| Opción | A favor | En contra |
|---|---|---|
| Como textos (`string[]`) | La API responde el mismo texto que antes y `lib/turnos.ts` no cambia | Para decidir según el motivo habría que comparar textos |
| Como `z.enum` | Si aparece un motivo nuevo, el compilador obliga a decidir cómo se traduce | Hoy la API y la pantalla solo muestran el motivo: sería trabajo sin uso |

**Qué hacer con la concurrencia**

| Opción | A favor | En contra |
|---|---|---|
| Dejarlo para la clase 14 | No agrega código ahora | Las tres carreras quedan abiertas en producción |
| Una escritura condicional (el estado esperado en el `where` del `update`) | Una sola consulta, y gana la primera | Cancelar contra ingresar toca dos tablas, el turno y la orden, y la regla habría que reescribirla como filtro |
| Una transacción serializable que repite la regla de `lib/turnos.ts` antes de escribir | Usa la misma regla, sin reescribirla. Es el patrón que ya usan presupuestos y finalizar una orden | El turno se lee dos veces y los conflictos llegan como excepciones |

## Decisión

Elegimos **casos de uso en `lib/casos/turnos.ts`, motivos como textos y una transacción serializable en cada escritura**.

Porque así la API y la Server Action comparten una sola regla y, en las tres carreras, gana una sola transición.

La opción de dejar la concurrencia para la clase 14 fue el plan original de la #24 y se descartó después de la revisión. `z.enum` queda descartado por ahora.

La decisión se completa así:

1. **Qué hace un caso.** Los pasos 3 y 4 del orden de AGENTS.md: lee el turno, aplica la regla, escribe y, al confirmar, avisa. No lee la sesión ni valida la entrada: recibe el id ya validado y, en cancelar, el `usuarioId` de la sesión. Devuelve una unión discriminada (`NO_EXISTE`, `RECHAZADO { motivos }` o el éxito) que cada puerta traduce: el Route Handler a HTTP, y la Server Action a `EstadoFormulario`.
2. **Escrituras protegidas.** `marcarTurnoConfirmado` y `marcarTurnoCancelado` (`lib/db/turnos.ts`) e `insertarOrdenDesdeTurno` (`lib/db/ordenes-trabajo.ts`) vuelven a leer el turno dentro de una transacción serializable y aplican la misma regla antes de escribir. Si otro pedido lo cambió, lanzan `ConflictoNegocio` con el texto de la regla. Si los dos pedidos chocan dentro de la base, Postgres aborta uno (P2034). Un segundo ingreso también choca con el índice único de `turnoId` (P2002).
3. **El correo sale después de guardar**, y solo si la escritura no lanzó: una confirmación que pierde la carrera no avisa.

## Consecuencias

- La API y la Server Action comparten la regla: un cambio en `lib/turnos.ts` vale para las dos puertas. La primera puerta nueva es la Server Action del detalle del turno (`app/(app)/turnos/[id]/acciones.ts`).
- El turno se lee dos veces: en el caso, para decidir y responder el rechazo, y en la transacción, para no pisar un cambio. Es una consulta más por operación.
- Los casos lanzan `ConflictoNegocio`, P2034 o P2002, y quien llama los traduce: la API, a 409 con `responderError`, y la Server Action, a "El turno cambió mientras se procesaba. Actualizá la página e intentá de nuevo.". Quien agregue otra puerta tiene que capturarlos.
- Los tests con mocks prueban que la regla se repite dentro de la transacción, pero no la concurrencia real: que Postgres aborte uno de dos pedidos simultáneos. Eso queda para la clase 13, con una base PostgreSQL de pruebas, nunca la de producción.
- Si alguien necesita decidir según el motivo (por ejemplo, responder distinto a "ya está cancelado" que a "ya tiene orden"), los motivos pasan a `z.enum` y hay que revisar este ADR.
