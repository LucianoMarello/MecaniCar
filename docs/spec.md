# Especificación funcional — MecaniCar

## 1. Descripción general

MecaniCar es una aplicación web destinada a la gestión básica de un taller mecánico.

El sistema busca centralizar el proceso de atención de los vehículos desde la solicitud de un turno hasta la finalización de una reparación.

Los clientes pueden registrar sus vehículos, solicitar turnos, consultar su estado, visualizar presupuestos y aprobarlos o rechazarlos.

Los mecánicos pueden administrar los turnos, registrar el ingreso de los vehículos al taller, generar órdenes de trabajo, confeccionar presupuestos utilizando un catálogo de servicios y actualizar el estado de las reparaciones.

El objetivo del MVP es implementar un flujo de negocio completo manteniendo un alcance reducido y realizable durante la cursada.

---

# 2. Roles

El sistema contempla dos roles principales.

## 2.1. Cliente

Representa a una persona que utiliza los servicios del taller.

Puede:

* Iniciar sesión.
* Registrar vehículos.
* Consultar sus vehículos.
* Modificar los datos permitidos de sus vehículos.
* Solicitar turnos.
* Consultar sus turnos.
* Cancelar turnos cuando corresponda.
* Consultar presupuestos asociados a sus vehículos.
* Aprobar presupuestos.
* Rechazar presupuestos.
* Consultar el estado de las reparaciones.

Un cliente solamente puede acceder a información correspondiente a sus propios vehículos.

## 2.2. Mecánico

Representa al personal del taller encargado de administrar la atención de los vehículos.

Puede:

* Iniciar sesión.
* Consultar los turnos solicitados.
* Confirmar turnos.
* Cancelar turnos.
* Registrar el ingreso de un vehículo.
* Crear órdenes de trabajo.
* Consultar órdenes de trabajo.
* Crear presupuestos.
* Agregar servicios a los presupuestos.
* Consultar presupuestos.
* Administrar el catálogo de servicios.
* Actualizar el estado de una orden de trabajo.
* Finalizar una reparación.

---

# 3. Entidades del dominio

## 3.1. Vehículo

Representa un vehículo perteneciente a un cliente.

### Datos principales

* Identificador.
* Patente.
* Marca.
* Modelo.
* Año.
* Propietario.

### Reglas

* Todo vehículo debe pertenecer a un cliente.
* La patente identifica de forma única al vehículo dentro del sistema.
* Un cliente puede tener varios vehículos.
* Un cliente solamente puede administrar sus propios vehículos.

---

## 3.2. Turno

Representa una solicitud de atención realizada para un vehículo.

### Datos principales

* Identificador.
* Vehículo.
* Cliente.
* Fecha y hora.
* Motivo.
* Estado.
* Fecha de creación.

### Estados

* `PENDIENTE`
* `CONFIRMADO`
* `CANCELADO`

### Reglas

* Todo turno debe corresponder a un vehículo.
* El vehículo debe pertenecer al cliente que solicita el turno.
* No pueden solicitarse turnos para fechas anteriores a la fecha actual.
* Todo turno nuevo se crea en estado `PENDIENTE`.
* Un turno pendiente puede ser confirmado por un mecánico.
* Un turno puede ser cancelado cuando las reglas de negocio lo permitan.
* Un turno cancelado no puede confirmarse.

---

## 3.3. Orden de Trabajo

Representa el ingreso efectivo de un vehículo al taller y el seguimiento de su reparación.

La existencia de un turno no implica que exista automáticamente una orden de trabajo. La orden se genera cuando el vehículo efectivamente ingresa al taller.

### Datos principales

* Identificador.
* Turno de origen.
* Vehículo.
* Fecha de ingreso.
* Estado.
* Fecha de creación.

### Estados

* `ABIERTA`
* `EN_REPARACION`
* `FINALIZADA`

### Reglas

* Una orden de trabajo debe estar asociada a un vehículo.
* Una orden se genera cuando el vehículo ingresa al taller.
* Un turno puede generar como máximo una orden de trabajo.
* No se puede generar una orden a partir de un turno cancelado.
* Una orden nueva se crea en estado `ABIERTA`.
* Una orden puede pasar a `EN_REPARACION` cuando existe un presupuesto aprobado.
* Una orden `EN_REPARACION` puede pasar a `FINALIZADA`.
* Una orden finalizada no puede volver a un estado anterior.

---

## 3.4. Servicio

Representa un tipo de trabajo que el taller puede incluir en un presupuesto.

### Ejemplos

* Cambio de aceite.
* Cambio de filtros.
* Cambio de pastillas de freno.
* Alineación.
* Cambio de correa.

### Datos principales

* Identificador.
* Nombre.
* Descripción.
* Precio actual.

### Reglas

* El nombre del servicio es obligatorio.
* El precio debe ser mayor que cero.
* El catálogo de servicios es administrado por los mecánicos.
* Un servicio puede aparecer en múltiples presupuestos.
* La modificación del precio de catálogo no debe modificar presupuestos generados anteriormente.

Servicio será una de las entidades sobre las cuales se implementará un CRUD completo.

---

## 3.5. Presupuesto

Representa la propuesta económica realizada por el taller para una orden de trabajo.

### Datos principales

* Identificador.
* Orden de trabajo.
* Estado.
* Fecha de creación.
* Detalles.

### Estados

* `PENDIENTE`
* `APROBADO`
* `RECHAZADO`

### Reglas

* Todo presupuesto debe pertenecer a una orden de trabajo.
* Un presupuesto debe contener al menos un servicio.
* Todo presupuesto nuevo se crea en estado `PENDIENTE`.
* Solamente un presupuesto pendiente puede ser aprobado o rechazado.
* El cliente solamente puede aprobar o rechazar presupuestos correspondientes a sus propios vehículos.
* Un presupuesto aprobado no puede posteriormente rechazarse.
* Un presupuesto rechazado no puede posteriormente aprobarse.
* La aprobación de un presupuesto habilita el inicio de la reparación.
* El total del presupuesto se obtiene a partir de la suma de sus detalles.

---

## 3.6. Detalle de Presupuesto

Representa un servicio concreto incluido dentro de un presupuesto.

Esta entidad permite resolver la relación muchos a muchos existente entre Presupuesto y Servicio.

### Datos principales

* Identificador.
* Presupuesto.
* Servicio.
* Precio aplicado.

### Reglas

* Todo detalle pertenece a un presupuesto.
* Todo detalle referencia un servicio.
* El precio aplicado se obtiene inicialmente del precio actual del servicio.
* El precio aplicado queda almacenado como valor histórico.
* Si posteriormente cambia el precio del servicio, los presupuestos existentes no deben modificarse.

Por ejemplo, si un cambio de aceite tiene un precio de $50.000 al generar un presupuesto, ese presupuesto conservará dicho valor aunque posteriormente el precio de catálogo cambie a $60.000.

---

# 4. Relaciones

Las relaciones principales del dominio son:

* Un cliente puede tener muchos vehículos.
* Un vehículo pertenece a un cliente.
* Un cliente puede solicitar muchos turnos.
* Un vehículo puede tener muchos turnos.
* Un turno corresponde a un vehículo.
* Un turno puede generar como máximo una orden de trabajo.
* Una orden de trabajo corresponde a un vehículo.
* Un vehículo puede tener muchas órdenes de trabajo.
* Una orden de trabajo puede tener uno o más presupuestos.
* Un presupuesto puede contener varios servicios.
* Un servicio puede aparecer en varios presupuestos.
* Detalle de Presupuesto resuelve la relación muchos a muchos entre Presupuesto y Servicio.

De forma conceptual:

```text id="3d2lxn"
Cliente 1 ───── N Vehiculo

Cliente 1 ───── N Turno

Vehiculo 1 ───── N Turno

Turno 1 ───── 0..1 OrdenTrabajo

Vehiculo 1 ───── N OrdenTrabajo

OrdenTrabajo 1 ───── N Presupuesto

Presupuesto 1 ───── N DetallePresupuesto

Servicio 1 ───── N DetallePresupuesto

Presupuesto N ───── N Servicio
```

---

# 5. Flujo principal del sistema

El flujo principal del MVP es el siguiente:

1. El cliente inicia sesión.
2. El cliente registra un vehículo si todavía no se encuentra registrado.
3. El cliente solicita un turno seleccionando el vehículo, la fecha y el motivo.
4. El turno se crea en estado `PENDIENTE`.
5. El mecánico consulta los turnos pendientes.
6. El mecánico confirma el turno.
7. El turno pasa a estado `CONFIRMADO`.
8. Cuando el vehículo llega al taller, el mecánico registra su ingreso.
9. Se genera una orden de trabajo en estado `ABIERTA`.
10. El mecánico confecciona un presupuesto.
11. El presupuesto contiene uno o más servicios.
12. El presupuesto se crea en estado `PENDIENTE`.
13. El cliente consulta el presupuesto.
14. El cliente decide aprobarlo o rechazarlo.
15. Si lo rechaza, el presupuesto pasa a `RECHAZADO`.
16. Si lo aprueba, el presupuesto pasa a `APROBADO`.
17. La orden de trabajo pasa a `EN_REPARACION`.
18. El mecánico realiza los trabajos correspondientes.
19. Al finalizar, la orden pasa a estado `FINALIZADA`.
20. El cliente puede consultar el estado final de la reparación.

---

# 6. Historias de usuario

## HU01 — Registrar vehículo

**Como** cliente
**quiero** registrar un vehículo
**para** poder solicitar turnos para dicho vehículo.

### Criterios de aceptación

* Cuando se proporciona una patente, marca y modelo válidos, el vehículo queda registrado y asociado al cliente autenticado.
* La patente no puede estar registrada previamente.
* Los campos obligatorios deben ser validados.
* Un cliente no puede registrar un vehículo a nombre de otro usuario.

---

## HU02 — Solicitar turno

**Como** cliente
**quiero** solicitar un turno para uno de mis vehículos
**para** llevarlo al taller.

### Criterios de aceptación

* El cliente debe seleccionar uno de sus vehículos.
* Debe indicar una fecha y hora.
* Debe indicar el motivo de la consulta.
* La fecha no puede encontrarse en el pasado.
* El vehículo seleccionado debe pertenecer al cliente autenticado.
* El turno se crea en estado `PENDIENTE`.

---

## HU03 — Consultar turnos

**Como** cliente
**quiero** consultar mis turnos
**para** conocer las fechas y estados de mis solicitudes.

### Criterios de aceptación

* El cliente solamente puede visualizar turnos correspondientes a sus vehículos.
* Cada turno debe mostrar al menos vehículo, fecha, motivo y estado.
* Un usuario no puede consultar los turnos privados de otro cliente.

---

## HU04 — Confirmar turno

**Como** mecánico
**quiero** confirmar un turno pendiente
**para** reservar la atención del vehículo.

### Criterios de aceptación

* Solamente un mecánico puede confirmar turnos.
* El turno debe existir.
* El turno debe encontrarse en estado `PENDIENTE`.
* Al confirmarse pasa a estado `CONFIRMADO`.
* Un turno cancelado no puede confirmarse.

---

## HU05 — Cancelar turno

**Como** cliente
**quiero** cancelar un turno
**para** informar que no asistiré al taller.

### Criterios de aceptación

* El cliente solamente puede cancelar sus propios turnos.
* Un turno ya cancelado no puede volver a cancelarse.
* Un turno que ya generó una orden de trabajo no puede ser cancelado por el cliente.
* El estado resultante es `CANCELADO`.

---

## HU06 — Registrar ingreso del vehículo

**Como** mecánico
**quiero** registrar el ingreso de un vehículo
**para** comenzar formalmente su atención.

### Criterios de aceptación

* El turno debe existir.
* El turno no puede encontrarse cancelado.
* Un mismo turno no puede generar más de una orden de trabajo.
* Al registrar el ingreso se crea una orden de trabajo.
* La nueva orden queda en estado `ABIERTA`.
* La fecha de ingreso queda registrada.

---

## HU07 — Administrar servicios

**Como** mecánico
**quiero** administrar el catálogo de servicios
**para** utilizarlos en los presupuestos.

### Criterios de aceptación

* El mecánico puede crear servicios.
* Puede consultar los servicios existentes.
* Puede modificar un servicio.
* Puede eliminar un servicio cuando corresponda.
* El nombre es obligatorio.
* El precio debe ser mayor que cero.
* Un cliente no puede administrar el catálogo.

Esta funcionalidad constituye el CRUD completo requerido para el MVP.

---

## HU08 — Crear presupuesto

**Como** mecánico
**quiero** confeccionar un presupuesto para una orden de trabajo
**para** informar al cliente el costo de los trabajos necesarios.

### Criterios de aceptación

* La orden de trabajo debe existir.
* El presupuesto debe contener al menos un servicio.
* Cada servicio agregado genera un detalle de presupuesto.
* Cada detalle conserva el precio utilizado al momento de generar el presupuesto.
* El presupuesto se crea en estado `PENDIENTE`.
* El total se obtiene sumando los precios de los detalles.

---

## HU09 — Consultar presupuesto

**Como** cliente
**quiero** consultar un presupuesto correspondiente a mi vehículo
**para** conocer los trabajos propuestos y su costo.

### Criterios de aceptación

* El cliente solamente puede consultar presupuestos asociados a sus vehículos.
* El presupuesto debe mostrar los servicios incluidos.
* Debe mostrar el precio aplicado a cada servicio.
* Debe mostrar el total.
* Debe mostrar el estado actual.

---

## HU10 — Aprobar presupuesto

**Como** cliente
**quiero** aprobar un presupuesto
**para** autorizar al taller a realizar los trabajos propuestos.

### Criterios de aceptación

* El presupuesto debe existir.
* Debe encontrarse en estado `PENDIENTE`.
* Debe corresponder a un vehículo perteneciente al cliente autenticado.
* Al aprobarse pasa a estado `APROBADO`.
* La orden de trabajo asociada pasa a estado `EN_REPARACION`.
* Un presupuesto aprobado no puede aprobarse nuevamente.

---

## HU11 — Rechazar presupuesto

**Como** cliente
**quiero** rechazar un presupuesto
**para** indicar que no autorizo los trabajos propuestos.

### Criterios de aceptación

* El presupuesto debe existir.
* Debe encontrarse en estado `PENDIENTE`.
* Debe corresponder a un vehículo perteneciente al cliente autenticado.
* Al rechazarse pasa a estado `RECHAZADO`.
* Un presupuesto rechazado no puede aprobarse posteriormente.

---

## HU12 — Finalizar reparación

**Como** mecánico
**quiero** finalizar una orden de trabajo
**para** indicar que la reparación ha terminado.

### Criterios de aceptación

* La orden debe existir.
* La orden debe encontrarse en estado `EN_REPARACION`.
* Al finalizar pasa a estado `FINALIZADA`.
* Una orden finalizada no puede volver a `EN_REPARACION`.

---

## HU13 — Consultar estado de reparación

**Como** cliente
**quiero** consultar el estado de la orden de trabajo de mi vehículo
**para** conocer el progreso de la reparación.

### Criterios de aceptación

* El cliente solamente puede consultar órdenes correspondientes a sus vehículos.
* Debe poder visualizar el estado actual de la orden.
* Un cliente no puede acceder a órdenes pertenecientes a otros clientes.

---

# 7. Reglas de negocio

## Vehículos

**RN01.** Todo vehículo debe pertenecer a un cliente.

**RN02.** La patente debe ser única dentro del sistema.

**RN03.** Un cliente solamente puede administrar sus propios vehículos.

## Turnos

**RN04.** Todo turno debe estar asociado a un vehículo.

**RN05.** El vehículo debe pertenecer al cliente que solicita el turno.

**RN06.** No se pueden solicitar turnos para fechas anteriores a la actual.

**RN07.** Todo turno nuevo se crea en estado `PENDIENTE`.

**RN08.** Solamente un mecánico puede confirmar un turno.

**RN09.** Un turno cancelado no puede confirmarse.

**RN10.** Un turno que ya generó una orden de trabajo no puede ser cancelado por el cliente.

## Órdenes de trabajo

**RN11.** La orden de trabajo representa el ingreso efectivo del vehículo al taller.

**RN12.** Un turno puede generar como máximo una orden de trabajo.

**RN13.** Una orden nueva se crea en estado `ABIERTA`.

**RN14.** Una orden puede pasar a `EN_REPARACION` cuando existe un presupuesto aprobado.

**RN15.** Una orden `EN_REPARACION` puede pasar a `FINALIZADA`.

**RN16.** Una orden finalizada no puede volver a un estado anterior.

## Servicios

**RN17.** Todo servicio debe tener un nombre.

**RN18.** El precio de un servicio debe ser mayor que cero.

**RN19.** Solamente los mecánicos pueden administrar el catálogo de servicios.

## Presupuestos

**RN20.** Todo presupuesto debe pertenecer a una orden de trabajo.

**RN21.** Todo presupuesto debe contener al menos un servicio.

**RN22.** Todo presupuesto nuevo se crea en estado `PENDIENTE`.

**RN23.** El precio incluido en un detalle queda registrado como valor histórico.

**RN24.** Un cambio posterior en el precio de catálogo de un servicio no modifica presupuestos existentes.

**RN25.** El total del presupuesto se calcula como la suma de sus detalles.

**RN26.** Solamente un presupuesto `PENDIENTE` puede ser aprobado o rechazado.

**RN27.** Solamente el cliente propietario del vehículo puede aprobar o rechazar el presupuesto correspondiente.

**RN28.** Un presupuesto `APROBADO` no puede pasar a `RECHAZADO`.

**RN29.** Un presupuesto `RECHAZADO` no puede pasar a `APROBADO`.

**RN30.** La aprobación de un presupuesto permite que la orden correspondiente pase a `EN_REPARACION`.

---

# 8. Matriz básica de permisos

| Acción                       | Cliente | Mecánico |
| ---------------------------- | ------: | -------: |
| Registrar vehículo propio    |      Sí |       No |
| Consultar vehículos propios  |      Sí |       No |
| Solicitar turno              |      Sí |       No |
| Consultar turnos propios     |      Sí |       Sí |
| Confirmar turno              |      No |       Sí |
| Cancelar turno propio        |      Sí |       Sí |
| Registrar ingreso            |      No |       Sí |
| Crear orden de trabajo       |      No |       Sí |
| Consultar orden propia       |      Sí |       Sí |
| Crear servicio               |      No |       Sí |
| Consultar servicios          |      Sí |       Sí |
| Modificar servicio           |      No |       Sí |
| Eliminar servicio            |      No |       Sí |
| Crear presupuesto            |      No |       Sí |
| Consultar presupuesto propio |      Sí |       Sí |
| Aprobar presupuesto          |      Sí |       No |
| Rechazar presupuesto         |      Sí |       No |
| Finalizar orden              |      No |       Sí |

Las restricciones de propiedad indicadas como "propio" deben verificarse en el servidor.

---

# 9. Requisitos no funcionales

## 9.1. Usabilidad

* La solicitud de un turno debe realizarse mediante un flujo simple.
* El cliente debe poder identificar fácilmente el estado de sus turnos.
* Los presupuestos deben mostrar claramente los servicios, precios y total.
* Las acciones de aprobar y rechazar deben ser claramente identificables.
* Los mensajes de error deben indicar el problema de forma comprensible.
* Ante errores de validación, los datos válidos ingresados no deben perderse innecesariamente.
* Las acciones principales deben mantener una presentación consistente en todo el sistema.

## 9.2. Accesibilidad

* Las funciones principales deben poder utilizarse mediante teclado.
* Los campos de formularios deben poseer etiquetas asociadas.
* El foco de teclado debe ser visible.
* Los errores no deben comunicarse exclusivamente mediante colores.
* Las imágenes informativas deben contar con texto alternativo cuando corresponda.
* Se debe mantener un nivel adecuado de contraste entre texto y fondo.

## 9.3. Seguridad

* Las operaciones que requieran autenticación deben validarse en el servidor.
* Los permisos correspondientes a cada rol deben comprobarse en el servidor.
* Un cliente no debe poder acceder a recursos privados pertenecientes a otro cliente.
* Las entradas externas deben validarse antes de ser procesadas.
* Las credenciales y secretos no deben almacenarse en el repositorio.

## 9.4. Mantenibilidad

* El proyecto debe utilizar TypeScript.
* Las reglas del dominio deben mantenerse separadas de la interfaz cuando corresponda.
* El acceso a datos debe estar centralizado.
* Las reglas funcionales deben mantenerse alineadas con este documento.
* Los cambios significativos de alcance deben reflejarse primero en la especificación.

---

# 10. Integración externa

El MVP incorporará al menos una integración con un servicio externo.

La integración propuesta consiste en el envío de notificaciones por correo electrónico ante eventos relevantes.

Como mínimo se implementará una notificación asociada al flujo principal.

Ejemplos posibles:

* Notificación al cliente cuando un turno es confirmado.
* Notificación al cliente cuando existe un nuevo presupuesto disponible.

La integración concreta y el proveedor utilizado se definirán durante la implementación.

---

# 11. Fuera de alcance

Para mantener un MVP realizable durante la cursada, quedan expresamente fuera del alcance:

* Gestión de stock.
* Control de inventario.
* Gestión de proveedores.
* Compras de repuestos.
* Trazabilidad individual de repuestos.
* Facturación.
* Caja.
* Contabilidad.
* Pagos online.
* Gestión de múltiples sucursales.
* Gestión avanzada de empleados.
* Aplicación móvil nativa.
* Chat entre cliente y taller.
* Notificaciones push.
* Estadísticas avanzadas.
* Reportes avanzados.
* Auditoría avanzada.
* Sistema configurable de roles y permisos.
* Historial mecánico avanzado.
* Gestión de garantías.

Estas funcionalidades podrán considerarse como futuras extensiones, pero no forman parte del MVP.

---

# 12. Criterio de finalización del MVP

El MVP se considerará funcional cuando pueda completarse el siguiente recorrido de punta a punta:

1. Un cliente autenticado registra un vehículo.
2. Solicita un turno para ese vehículo.
3. Un mecánico confirma el turno.
4. El mecánico registra el ingreso del vehículo.
5. Se crea una orden de trabajo.
6. El mecánico genera un presupuesto con uno o más servicios.
7. El cliente consulta el presupuesto.
8. El cliente aprueba el presupuesto.
9. La orden pasa a reparación.
10. El mecánico finaliza la orden.
11. El cliente puede consultar que la reparación se encuentra finalizada.

El flujo debe respetar las reglas de negocio y permisos definidos en esta especificación.
