# Especificación funcional — MecaniCar

## 1. Problema, usuarios y objetivo

MecaniCar es una aplicación web destinada a la gestión básica de un taller mecánico.

Actualmente, gran parte de la información relacionada con turnos, vehículos, presupuestos y reparaciones puede manejarse de manera separada o informal, dificultando que tanto el cliente como el taller conozcan claramente el estado de una atención.

MecaniCar busca centralizar este proceso desde la solicitud de un turno hasta la finalización de una reparación.

Los principales usuarios del sistema son los clientes del taller y los mecánicos.

Los clientes pueden registrar sus vehículos, solicitar turnos, consultar su estado, visualizar presupuestos y aprobarlos o rechazarlos.

Los mecánicos pueden administrar los turnos, registrar el ingreso de los vehículos al taller, generar órdenes de trabajo, confeccionar presupuestos utilizando un catálogo de servicios y actualizar el estado de las reparaciones.

El objetivo del MVP es implementar un flujo de negocio completo manteniendo un alcance reducido y realizable durante la cursada.

---

## 2. Roles

El sistema contempla dos roles.

### 2.1. Cliente

Representa a una persona que utiliza los servicios del taller.

Puede:

* Iniciar sesión.
* Registrar vehículos.
* Consultar sus vehículos.
* Modificar los datos permitidos de sus vehículos.
* Solicitar turnos.
* Consultar sus turnos.
* Cancelar sus turnos cuando corresponda.
* Consultar presupuestos asociados a sus vehículos.
* Aprobar presupuestos.
* Rechazar presupuestos.
* Consultar el estado de las reparaciones.

Un cliente solamente puede acceder a información correspondiente a sus propios vehículos.

### 2.2. Mecánico

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

## 3. Entidades del dominio

El sistema posee seis entidades principales de dominio, sin contar los usuarios utilizados para autenticación y autorización.

### 3.1. Vehículo

Representa un vehículo perteneciente a un cliente.

#### Datos principales

* Identificador.
* Patente.
* Marca.
* Modelo.
* Año.
* Propietario.

#### Reglas

* Todo vehículo debe pertenecer a un cliente.
* La patente debe ser única dentro del sistema.
* Un cliente puede tener varios vehículos.
* Un cliente solamente puede administrar sus propios vehículos.

---

### 3.2. Turno

Representa una solicitud de atención realizada para un vehículo.

#### Datos principales

* Identificador.
* Vehículo.
* Cliente.
* Fecha y hora.
* Motivo.
* Estado.
* Fecha de creación.

#### Estados

* `PENDIENTE`
* `CONFIRMADO`
* `CANCELADO`

#### Reglas

* Todo turno debe corresponder a un vehículo.
* El vehículo debe pertenecer al cliente que solicita el turno.
* No se pueden solicitar turnos para fechas anteriores a la fecha actual.
* Todo turno nuevo se crea en estado `PENDIENTE`.
* Un turno pendiente puede ser confirmado por un mecánico.
* Un turno puede ser cancelado cuando las reglas de negocio lo permitan.
* Un turno cancelado no puede confirmarse.

---

### 3.3. Orden de Trabajo

Representa el ingreso efectivo de un vehículo al taller y permite realizar el seguimiento de su reparación.

La existencia de un turno no implica que exista automáticamente una orden de trabajo. La orden se genera cuando el vehículo efectivamente ingresa al taller.

#### Datos principales

* Identificador.
* Turno de origen.
* Vehículo.
* Fecha de ingreso.
* Estado.
* Fecha de creación.

#### Estados

* `ABIERTA`
* `EN_REPARACION`
* `FINALIZADA`

#### Reglas

* Una orden de trabajo debe estar asociada a un vehículo.
* Una orden se genera cuando el vehículo ingresa al taller.
* Un turno puede generar como máximo una orden de trabajo.
* No se puede generar una orden a partir de un turno cancelado.
* Una orden nueva se crea en estado `ABIERTA`.
* Una orden puede pasar a `EN_REPARACION` cuando existe un presupuesto aprobado.
* Una orden `EN_REPARACION` puede pasar a `FINALIZADA`.
* Una orden finalizada no puede volver a un estado anterior.

---

### 3.4. Servicio

Representa un tipo de trabajo que el taller puede incluir en un presupuesto.

Ejemplos:

* Cambio de aceite.
* Cambio de filtros.
* Cambio de pastillas de freno.
* Alineación.
* Cambio de correa.

#### Datos principales

* Identificador.
* Nombre.
* Descripción.
* Precio actual.

#### Reglas

* El nombre del servicio es obligatorio.
* El precio debe ser mayor que cero.
* El catálogo de servicios es administrado por los mecánicos.
* Un servicio puede aparecer en múltiples presupuestos.
* La modificación del precio de catálogo no debe alterar presupuestos generados anteriormente.

Servicio será una de las entidades sobre las cuales se implementará un CRUD completo.

---

### 3.5. Presupuesto

Representa la propuesta económica realizada por el taller para una orden de trabajo.

#### Datos principales

* Identificador.
* Orden de trabajo.
* Estado.
* Fecha de creación.
* Detalles.

#### Estados

* `PENDIENTE`
* `APROBADO`
* `RECHAZADO`

#### Reglas

* Todo presupuesto debe pertenecer a una orden de trabajo.
* Un presupuesto debe contener al menos un servicio.
* Todo presupuesto nuevo se crea en estado `PENDIENTE`.
* Solamente un presupuesto pendiente puede ser aprobado o rechazado.
* El cliente solamente puede aprobar o rechazar presupuestos correspondientes a sus propios vehículos.
* Un presupuesto aprobado no puede posteriormente rechazarse.
* Un presupuesto rechazado no puede posteriormente aprobarse.
* La aprobación de un presupuesto habilita el inicio de la reparación.
* El total del presupuesto se calcula a partir de la suma de sus detalles.

---

### 3.6. Detalle de Presupuesto

Representa un servicio concreto incluido dentro de un presupuesto.

Esta entidad resuelve la relación muchos a muchos existente entre Presupuesto y Servicio.

#### Datos principales

* Identificador.
* Presupuesto.
* Servicio.
* Precio aplicado.

#### Reglas

* Todo detalle pertenece a un presupuesto.
* Todo detalle referencia un servicio.
* El precio aplicado se obtiene inicialmente del precio actual del servicio.
* El precio aplicado queda almacenado como valor histórico.
* Una modificación posterior del precio del servicio no modifica los presupuestos existentes.

Por ejemplo, si un cambio de aceite cuesta $50.000 al generar un presupuesto, dicho presupuesto conserva ese valor aunque posteriormente el precio del servicio cambie a $60.000.

---

## 4. Relaciones principales

Las principales relaciones del dominio son:

* Un cliente puede tener muchos vehículos.
* Un vehículo pertenece a un cliente.
* Un cliente puede solicitar muchos turnos.
* Un vehículo puede tener muchos turnos.
* Un turno corresponde a un vehículo.
* Un turno puede generar como máximo una orden de trabajo.
* Una orden de trabajo corresponde a un vehículo.
* Un vehículo puede tener varias órdenes de trabajo.
* Una orden de trabajo puede tener uno o más presupuestos.
* Un presupuesto puede contener varios servicios.
* Un servicio puede aparecer en varios presupuestos.
* Detalle de Presupuesto resuelve la relación muchos a muchos entre Presupuesto y Servicio.

Representación conceptual:

```text
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

## 5. Historias de usuario

Las historias asumen que el usuario se encuentra autenticado con el rol correspondiente.

### HU01 — Registrar vehículo

**Como** cliente
**quiero** registrar un vehículo
**para** poder solicitar turnos para dicho vehículo.

#### Criterios de aceptación

**Camino exitoso**

Dado que la patente no se encuentra registrada, cuando el cliente completa patente, marca y modelo con valores válidos y confirma el registro, entonces el vehículo se guarda asociado al cliente autenticado.

**Error**

Dado que ya existe un vehículo con la misma patente, cuando el cliente intenta registrarlo, entonces el vehículo no se guarda y el sistema informa que la patente ya se encuentra registrada.

**Error de validación**

Cuando falta un campo obligatorio, entonces el sistema señala el campo correspondiente y conserva los demás valores válidos ingresados.

---

### HU02 — Solicitar turno

**Como** cliente
**quiero** solicitar un turno para uno de mis vehículos
**para** llevarlo al taller.

#### Criterios de aceptación

**Camino exitoso**

Dado que el vehículo pertenece al cliente, cuando selecciona una fecha y hora futuras e indica un motivo, entonces se crea un turno en estado `PENDIENTE`.

**Error**

Dado que la fecha seleccionada es anterior a la fecha y hora actual, cuando el cliente intenta solicitar el turno, entonces el turno no se crea y se informa que la fecha no es válida.

**Error de autorización**

Dado que el vehículo pertenece a otro cliente, cuando el usuario intenta solicitar un turno para ese vehículo, entonces la operación se rechaza.

---

### HU03 — Consultar turnos

**Como** cliente
**quiero** consultar mis turnos
**para** conocer sus fechas y estados.

#### Criterios de aceptación

**Camino exitoso**

Cuando el cliente consulta sus turnos, entonces el sistema muestra únicamente los turnos correspondientes a sus vehículos e informa vehículo, fecha, motivo y estado.

**Error**

Dado que un turno pertenece a otro cliente, cuando el usuario intenta acceder directamente a dicho turno, entonces el sistema no permite consultar su información.

---

### HU04 — Confirmar turno

**Como** mecánico
**quiero** confirmar un turno pendiente
**para** reservar la atención del vehículo.

#### Criterios de aceptación

**Camino exitoso**

Dado que el turno se encuentra en estado `PENDIENTE`, cuando el mecánico lo confirma, entonces el turno pasa a estado `CONFIRMADO`.

**Error**

Dado que el turno se encuentra en estado `CANCELADO`, cuando el mecánico intenta confirmarlo, entonces el estado no se modifica y el sistema informa que la operación no está permitida.

---

### HU05 — Cancelar turno

**Como** cliente
**quiero** cancelar uno de mis turnos
**para** informar que no asistiré al taller.

#### Criterios de aceptación

**Camino exitoso**

Dado que el turno pertenece al cliente y todavía no generó una orden de trabajo, cuando el cliente lo cancela, entonces pasa a estado `CANCELADO`.

**Error**

Dado que el turno ya generó una orden de trabajo, cuando el cliente intenta cancelarlo, entonces la operación se rechaza y se informa que el vehículo ya ingresó al taller.

---

### HU06 — Registrar ingreso del vehículo

**Como** mecánico
**quiero** registrar el ingreso de un vehículo
**para** comenzar formalmente su atención.

#### Criterios de aceptación

**Camino exitoso**

Dado que existe un turno confirmado y todavía no tiene una orden de trabajo, cuando el mecánico registra el ingreso del vehículo, entonces se crea una orden de trabajo en estado `ABIERTA` y se registra la fecha de ingreso.

**Error**

Dado que el turno ya posee una orden de trabajo, cuando se intenta registrar nuevamente el ingreso, entonces no se crea otra orden y se informa que el ingreso ya fue registrado.

**Error**

Dado que el turno se encuentra `CANCELADO`, cuando el mecánico intenta registrar el ingreso, entonces la operación se rechaza.

---

### HU07 — Administrar servicios

**Como** mecánico
**quiero** administrar el catálogo de servicios
**para** utilizarlos al confeccionar presupuestos.

#### Criterios de aceptación

**Camino exitoso**

Cuando el mecánico registra un servicio con nombre y precio válido, entonces el servicio queda disponible en el catálogo.

Cuando modifica un servicio existente con datos válidos, entonces los nuevos datos quedan disponibles para presupuestos futuros.

Cuando consulta el catálogo, entonces puede visualizar los servicios disponibles.

**Error**

Dado que el precio informado es menor o igual a cero, cuando se intenta guardar el servicio, entonces la operación se rechaza y se informa que el precio debe ser mayor que cero.

**Error de autorización**

Dado que el usuario tiene rol Cliente, cuando intenta crear, modificar o eliminar un servicio, entonces la operación se rechaza.

Esta funcionalidad constituye el CRUD completo requerido para el MVP.

---

### HU08 — Crear presupuesto

**Como** mecánico
**quiero** confeccionar un presupuesto para una orden de trabajo
**para** informar al cliente el costo de los trabajos necesarios.

#### Criterios de aceptación

**Camino exitoso**

Dado que la orden de trabajo existe, cuando el mecánico selecciona uno o más servicios y crea el presupuesto, entonces se genera un presupuesto en estado `PENDIENTE`.

Por cada servicio seleccionado se genera un detalle que conserva el precio vigente del servicio al momento de crear el presupuesto.

El total se obtiene sumando los precios aplicados de sus detalles.

**Error**

Dado que no se seleccionó ningún servicio, cuando el mecánico intenta crear el presupuesto, entonces el presupuesto no se guarda y se informa que debe contener al menos un servicio.

---

### HU09 — Consultar presupuesto

**Como** cliente
**quiero** consultar un presupuesto correspondiente a mi vehículo
**para** conocer los trabajos propuestos y su costo.

#### Criterios de aceptación

**Camino exitoso**

Dado que el presupuesto corresponde a uno de sus vehículos, cuando el cliente lo consulta, entonces puede visualizar los servicios incluidos, el precio aplicado a cada servicio, el total y el estado.

**Error**

Dado que el presupuesto corresponde al vehículo de otro cliente, cuando intenta acceder a él, entonces el sistema rechaza el acceso.

---

### HU10 — Aprobar presupuesto

**Como** cliente
**quiero** aprobar un presupuesto
**para** autorizar al taller a realizar los trabajos.

#### Criterios de aceptación

**Camino exitoso**

Dado que el presupuesto corresponde a uno de sus vehículos y se encuentra `PENDIENTE`, cuando el cliente lo aprueba, entonces el presupuesto pasa a `APROBADO` y la orden de trabajo asociada pasa a `EN_REPARACION`.

**Error**

Dado que el presupuesto ya se encuentra `APROBADO` o `RECHAZADO`, cuando el cliente intenta aprobarlo, entonces la operación se rechaza y no se modifican los estados.

**Error de autorización**

Dado que el presupuesto corresponde al vehículo de otro cliente, cuando intenta aprobarlo, entonces la operación se rechaza.

---

### HU11 — Rechazar presupuesto

**Como** cliente
**quiero** rechazar un presupuesto
**para** indicar que no autorizo los trabajos.

#### Criterios de aceptación

**Camino exitoso**

Dado que el presupuesto corresponde a uno de sus vehículos y se encuentra `PENDIENTE`, cuando el cliente lo rechaza, entonces pasa a estado `RECHAZADO`.

**Error**

Dado que el presupuesto ya se encuentra `APROBADO`, cuando el cliente intenta rechazarlo, entonces la operación se rechaza y el estado permanece sin cambios.

---

### HU12 — Finalizar reparación

**Como** mecánico
**quiero** finalizar una orden de trabajo
**para** indicar que la reparación terminó.

#### Criterios de aceptación

**Camino exitoso**

Dado que la orden se encuentra en estado `EN_REPARACION`, cuando el mecánico registra la finalización, entonces la orden pasa a estado `FINALIZADA`.

**Error**

Dado que la orden se encuentra `ABIERTA` y no posee un presupuesto aprobado, cuando el mecánico intenta finalizarla, entonces la operación se rechaza.

**Error**

Dado que una orden ya se encuentra `FINALIZADA`, cuando se intenta volver a modificar su estado, entonces la operación se rechaza.

---

### HU13 — Consultar estado de reparación

**Como** cliente
**quiero** consultar el estado de la reparación de mi vehículo
**para** conocer el progreso del trabajo.

#### Criterios de aceptación

**Camino exitoso**

Dado que la orden corresponde a uno de sus vehículos, cuando el cliente la consulta, entonces puede visualizar su estado actual.

**Error**

Dado que la orden pertenece al vehículo de otro cliente, cuando intenta consultarla, entonces el sistema rechaza el acceso.

---

## 6. Flujo principal del sistema

El recorrido principal del MVP es:

1. El cliente inicia sesión.
2. Registra un vehículo si todavía no se encuentra registrado.
3. Solicita un turno seleccionando el vehículo, una fecha y un motivo.
4. El turno queda `PENDIENTE`.
5. El mecánico consulta los turnos pendientes.
6. El mecánico confirma el turno.
7. El turno pasa a `CONFIRMADO`.
8. El vehículo llega al taller.
9. El mecánico registra su ingreso.
10. Se genera una orden de trabajo `ABIERTA`.
11. El mecánico confecciona un presupuesto utilizando uno o más servicios.
12. El presupuesto queda `PENDIENTE`.
13. El cliente consulta el presupuesto.
14. El cliente lo aprueba o rechaza.
15. Si se rechaza, pasa a `RECHAZADO`.
16. Si se aprueba, pasa a `APROBADO`.
17. La orden pasa a `EN_REPARACION`.
18. El mecánico realiza los trabajos.
19. El mecánico finaliza la reparación.
20. La orden pasa a `FINALIZADA`.
21. El cliente puede consultar el estado final.

Este flujo constituye el proceso de negocio principal del sistema y no un simple conjunto de operaciones CRUD.

---

## 7. Reglas de negocio

### Vehículos

**RN01.** Todo vehículo debe pertenecer a un cliente.

**RN02.** La patente debe ser única dentro del sistema.

**RN03.** Un cliente solamente puede administrar sus propios vehículos.

### Turnos

**RN04.** Todo turno debe estar asociado a un vehículo.

**RN05.** El vehículo debe pertenecer al cliente que solicita el turno.

**RN06.** No se pueden solicitar turnos para fechas anteriores a la actual.

**RN07.** Todo turno nuevo se crea en estado `PENDIENTE`.

**RN08.** Solamente un mecánico puede confirmar un turno.

**RN09.** Un turno cancelado no puede confirmarse.

**RN10.** Un turno que ya generó una orden de trabajo no puede ser cancelado por el cliente.

### Órdenes de trabajo

**RN11.** La orden de trabajo representa el ingreso efectivo del vehículo al taller.

**RN12.** Un turno puede generar como máximo una orden de trabajo.

**RN13.** Una orden nueva se crea en estado `ABIERTA`.

**RN14.** Una orden puede pasar a `EN_REPARACION` cuando existe un presupuesto aprobado.

**RN15.** Una orden `EN_REPARACION` puede pasar a `FINALIZADA`.

**RN16.** Una orden finalizada no puede volver a un estado anterior.

### Servicios

**RN17.** Todo servicio debe tener un nombre.

**RN18.** El precio de un servicio debe ser mayor que cero.

**RN19.** Solamente los mecánicos pueden administrar el catálogo de servicios.

### Presupuestos

**RN20.** Todo presupuesto debe pertenecer a una orden de trabajo.

**RN21.** Todo presupuesto debe contener al menos un servicio.

**RN22.** Todo presupuesto nuevo se crea en estado `PENDIENTE`.

**RN23.** El precio incluido en un detalle queda registrado como valor histórico.

**RN24.** Un cambio posterior en el precio del catálogo de un servicio no modifica presupuestos existentes.

**RN25.** El total del presupuesto se calcula como la suma de sus detalles.

**RN26.** Solamente un presupuesto `PENDIENTE` puede ser aprobado o rechazado.

**RN27.** Solamente el cliente propietario del vehículo puede aprobar o rechazar el presupuesto correspondiente.

**RN28.** Un presupuesto `APROBADO` no puede pasar a `RECHAZADO`.

**RN29.** Un presupuesto `RECHAZADO` no puede pasar a `APROBADO`.

**RN30.** La aprobación de un presupuesto permite que la orden correspondiente pase a `EN_REPARACION`.

---

## 8. Requisitos no funcionales

### 8.1. Usabilidad

* Un cliente debe poder iniciar la solicitud de un turno desde la pantalla principal de su sesión con una única acción de navegación.
* La solicitud de un turno debe poder completarse utilizando como máximo cuatro campos de entrada: vehículo, fecha y hora, motivo y confirmación.
* Los estados de turnos, presupuestos y órdenes deben representarse siempre utilizando los mismos nombres en todo el sistema.
* Si un formulario contiene un error, debe indicarse qué campo debe corregirse sin eliminar los demás datos válidos ingresados.
* Las acciones principales de cada pantalla deben mantener una ubicación y presentación consistentes.
* Antes del Demo Day, al menos una persona ajena al equipo debe poder completar el flujo principal sin recibir instrucciones de los integrantes.

### 8.2. Accesibilidad

* Todas las acciones principales deben poder operarse mediante teclado.
* El elemento que posee el foco debe ser visualmente identificable.
* Todos los campos de formularios deben poseer una etiqueta asociada y no depender únicamente de un placeholder.
* Las imágenes informativas deben incluir texto alternativo.
* Las imágenes exclusivamente decorativas deben utilizar texto alternativo vacío.
* El contraste entre texto normal y fondo debe ser de al menos 4,5:1.
* Para texto grande, el contraste mínimo debe ser de 3:1.
* Ningún error debe comunicarse exclusivamente mediante color; debe existir también un mensaje textual.

### 8.3. Seguridad

* Las operaciones que requieran autenticación deben verificarse en el servidor.
* Los permisos correspondientes a cada rol deben comprobarse en el servidor.
* Un cliente no puede acceder a recursos privados pertenecientes a otro cliente.
* Las entradas externas deben validarse antes de ser procesadas.
* Las credenciales y secretos no deben almacenarse en el repositorio.

### 8.4. Mantenibilidad

* El proyecto debe utilizar TypeScript.
* No se debe utilizar `any`.
* Las reglas funcionales implementadas deben mantenerse alineadas con esta especificación.
* Los cambios significativos del alcance deben reflejarse primero en este documento.

---

## 9. Integración externa

El MVP incorporará al menos una integración con un servicio externo.

La integración prevista consiste en enviar una notificación por correo electrónico asociada a un evento relevante del flujo principal.

Posibles eventos:

* Confirmación de un turno.
* Disponibilidad de un nuevo presupuesto para el cliente.

El proveedor concreto se definirá durante la implementación de la integración.

---

## 10. Fuera de alcance

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

Estas funcionalidades pueden considerarse como futuras extensiones, pero no forman parte del MVP.

---

## 11. Criterio de finalización del MVP

El MVP se considerará funcional cuando pueda completarse el siguiente recorrido:

1. Un cliente autenticado registra un vehículo.
2. Solicita un turno.
3. Un mecánico confirma el turno.
4. El mecánico registra el ingreso del vehículo.
5. Se crea una orden de trabajo.
6. El mecánico genera un presupuesto con al menos un servicio.
7. El cliente consulta el presupuesto.
8. El cliente lo aprueba.
9. La orden pasa a reparación.
10. El mecánico finaliza la orden.
11. El cliente puede consultar que la reparación se encuentra finalizada.

Todo el recorrido debe respetar las reglas de negocio y permisos establecidos en esta especificación.
