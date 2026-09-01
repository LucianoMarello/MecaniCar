# Especificación del sistema

> Este documento es el relevamiento de requerimientos del proyecto (eje metodológico, clase 2).
>
> Se completa en la clase 2 y se mantiene actualizado todo el cuatrimestre.
>
> Regla práctica: si una funcionalidad no está acá, no se implementa.

## 1. El problema

**Para quién:**
MecaniCar está destinado a talleres mecánicos que necesitan organizar la atención de sus clientes y vehículos, y a los clientes que necesitan solicitar turnos y consultar el estado de los trabajos realizados sobre sus vehículos.

**Qué hace hoy sin el sistema:**
La gestión de clientes, vehículos, turnos, diagnósticos y presupuestos puede realizarse mediante anotaciones en papel, planillas, mensajes de WhatsApp u otros medios separados, dificultando el seguimiento de cada reparación y la comunicación con el cliente.

**Qué mejora:**
MecaniCar centraliza la información de los vehículos y clientes y permite gestionar el flujo de atención desde la solicitud del turno hasta la aprobación del presupuesto y finalización de la orden de trabajo.

## 2. Roles

| Rol      | Quién es                                                                                            | Qué puede hacer que el otro no                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cliente  | Persona que lleva uno o más vehículos al taller.                                                    | Puede registrar sus vehículos, solicitar turnos, consultar el estado de sus órdenes y aprobar presupuestos asociados a sus vehículos.                                                                                    |
| Mecánico | Personal del taller encargado de recibir vehículos, diagnosticar problemas y realizar los trabajos. | Puede gestionar turnos, crear órdenes de trabajo, registrar diagnósticos, modificar los datos de los vehículos cuando detecta información incorrecta, generar presupuestos y registrar servicios y repuestos utilizados. |

## 3. Entidades

| Entidad          | Qué representa                                                                                         | Se relaciona con                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Usuario          | Persona que utiliza el sistema y posee un rol dentro de MecaniCar.                                     | Cliente, Mecánico                                             |
| Vehículo         | Automóvil que pertenece a un cliente y puede ingresar al taller.                                       | Usuario/Cliente, Turno, Orden de Trabajo                      |
| Turno            | Solicitud de atención para un vehículo en una fecha y horario determinados.                            | Vehículo, Orden de Trabajo                                    |
| Orden de Trabajo | Registro de la reparación realizada sobre un vehículo.                                                 | Vehículo, Turno, Diagnóstico, Presupuesto, Servicio, Repuesto |
| Diagnóstico      | Resultado de la revisión realizada por el mecánico sobre un vehículo.                                  | Orden de Trabajo                                              |
| Presupuesto      | Detalle de los trabajos y costos propuestos para una orden de trabajo.                                 | Orden de Trabajo, Cliente                                     |
| Servicio         | Trabajo que puede realizar el taller, por ejemplo cambio de aceite, alineación o reparación de frenos. | Orden de Trabajo                                              |
| Repuesto         | Elemento utilizado durante una reparación y que puede formar parte del stock del taller.               | Orden de Trabajo                                              |

## 4. Historias de usuario

### H1 — Registrar vehículo

**Como** cliente, **quiero** registrar un vehículo, **para** poder solicitar turnos para llevarlo al taller.

Criterios de aceptación:

* [ ] Dado que el cliente está autenticado, cuando completa los datos obligatorios del vehículo, entonces el sistema registra el vehículo asociado a ese cliente.
* [ ] Dado que falta un dato obligatorio, cuando el cliente intenta guardar el vehículo, entonces el sistema informa el campo faltante y conserva los datos que ya fueron ingresados.
* [ ] Caso de error: cuando la patente ya está registrada para otro vehículo, el sistema rechaza el registro e informa el conflicto.

### H2 — Consultar vehículos

**Como** cliente, **quiero** consultar mis vehículos registrados, **para** conocer qué vehículos tengo asociados al sistema.

Criterios de aceptación:

* [ ] Dado que el cliente está autenticado, cuando accede a sus vehículos, entonces solamente puede visualizar los vehículos asociados a su cuenta.
* [ ] Caso de error: un cliente no puede visualizar información de vehículos pertenecientes a otro cliente.

### H3 — Corregir datos del vehículo

**Como** mecánico, **quiero** modificar los datos de un vehículo, **para** corregir información incorrecta o desactualizada detectada durante la atención en el taller.

Criterios de aceptación:

* [ ] Dado que el mecánico está autenticado, cuando modifica los datos de un vehículo y guarda los cambios, entonces el sistema actualiza la información.
* [ ] El mecánico puede corregir datos como patente, marca, modelo, año u otros datos registrados del vehículo.
* [ ] Caso de error: cuando el mecánico intenta asignar una patente que ya pertenece a otro vehículo, el sistema rechaza la modificación e informa el conflicto.
* [ ] Un cliente no puede modificar datos de un vehículo perteneciente a otro cliente.

### H4 — Solicitar turno

**Como** cliente, **quiero** solicitar un turno para uno de mis vehículos, **para** llevarlo al taller.

Criterios de aceptación:

* [ ] Dado que el cliente está autenticado y posee un vehículo registrado, cuando selecciona el vehículo, fecha y horario disponibles, entonces el sistema registra el turno.
* [ ] El turno queda asociado al vehículo seleccionado y al cliente correspondiente.
* [ ] Caso de error: cuando el horario seleccionado no está disponible, el sistema rechaza la solicitud y solicita elegir otro horario.
* [ ] Caso de error: un cliente no puede solicitar un turno utilizando un vehículo que no le pertenece.

### H5 — Gestionar turnos

**Como** mecánico, **quiero** consultar y gestionar los turnos solicitados, **para** organizar la atención del taller.

Criterios de aceptación:

* [ ] Dado que el mecánico está autenticado, cuando accede a los turnos, entonces puede consultar los turnos solicitados por los clientes.
* [ ] El mecánico puede actualizar el estado de un turno según el flujo definido por el sistema.
* [ ] Los turnos muestran como mínimo el vehículo, cliente, fecha, horario y estado.

### H6 — Crear orden de trabajo

**Como** mecánico, **quiero** crear una orden de trabajo asociada a un turno, **para** registrar la reparación realizada sobre el vehículo.

Criterios de aceptación:

* [ ] Dado que existe un turno correspondiente a un vehículo, cuando el mecánico inicia la atención, entonces puede generar una orden de trabajo asociada a ese turno.
* [ ] La orden de trabajo queda asociada al vehículo correspondiente.
* [ ] La orden posee un estado que permite conocer su progreso.

### H7 — Registrar diagnóstico

**Como** mecánico, **quiero** registrar el diagnóstico de una orden de trabajo, **para** documentar los problemas detectados en el vehículo.

Criterios de aceptación:

* [ ] Dado que existe una orden de trabajo, cuando el mecánico registra el diagnóstico, entonces el sistema lo asocia a dicha orden.
* [ ] El diagnóstico debe contener una descripción de los problemas detectados.
* [ ] Un cliente no puede modificar el diagnóstico registrado por el mecánico.

### H8 — Generar presupuesto

**Como** mecánico, **quiero** generar un presupuesto para una orden de trabajo, **para** informar al cliente los trabajos y costos estimados.

Criterios de aceptación:

* [ ] Dado que existe una orden de trabajo con un diagnóstico, cuando el mecánico genera un presupuesto, entonces este queda asociado a la orden correspondiente.
* [ ] El presupuesto informa los servicios y costos correspondientes.
* [ ] El cliente puede consultar el presupuesto de sus propios vehículos.
* [ ] Caso de error: el sistema no permite generar un presupuesto sin asociarlo a una orden de trabajo.

### H9 — Aprobar presupuesto

**Como** cliente, **quiero** consultar y aprobar un presupuesto, **para** autorizar al taller a realizar los trabajos propuestos.

Criterios de aceptación:

* [ ] Dado que existe un presupuesto asociado a un vehículo del cliente, cuando el cliente lo consulta, entonces puede visualizar los trabajos y costos propuestos.
* [ ] Cuando el cliente aprueba el presupuesto, entonces el sistema registra la aprobación.
* [ ] Caso de error: un cliente no puede aprobar un presupuesto que pertenece a otro cliente.
* [ ] Un presupuesto aprobado permite continuar con la ejecución de los trabajos correspondientes.

### H10 — Registrar servicios

**Como** mecánico, **quiero** asociar servicios a una orden de trabajo, **para** registrar qué trabajos deben realizarse sobre el vehículo.

Criterios de aceptación:

* [ ] Dado que existe una orden de trabajo, cuando el mecánico selecciona uno o más servicios, entonces estos quedan asociados a la orden.
* [ ] Una orden puede contener varios servicios.
* [ ] Un mismo servicio puede estar asociado a diferentes órdenes de trabajo.

### H11 — Registrar repuestos utilizados

**Como** mecánico, **quiero** registrar los repuestos utilizados en una orden de trabajo, **para** mantener actualizado el stock del taller.

Criterios de aceptación:

* [ ] Dado que existe una orden de trabajo, cuando el mecánico registra un repuesto utilizado, entonces este queda asociado a la orden.
* [ ] El sistema registra la cantidad utilizada.
* [ ] Cuando se registra el uso de un repuesto, el stock disponible se actualiza.
* [ ] Caso de error: el sistema no permite utilizar una cantidad superior al stock disponible.

### H12 — Consultar estado de la orden

**Como** cliente, **quiero** consultar el estado de la orden de trabajo de mi vehículo, **para** conocer el avance de la reparación.

Criterios de aceptación:

* [ ] Dado que el cliente está autenticado, cuando consulta una orden de su vehículo, entonces puede visualizar su estado actual.
* [ ] El cliente puede consultar únicamente órdenes asociadas a sus propios vehículos.
* [ ] El sistema muestra el estado actualizado de la orden.

## 5. Flujo principal

El flujo principal de MecaniCar es el recorrido de un vehículo desde la solicitud de atención hasta la finalización del trabajo.

1. El cliente inicia sesión y registra o selecciona uno de sus vehículos.
2. El cliente solicita un turno indicando el vehículo, fecha y horario.
3. El mecánico consulta los turnos y gestiona la solicitud.
4. El vehículo ingresa al taller y el mecánico genera una orden de trabajo.
5. El mecánico registra el diagnóstico del vehículo.
6. El mecánico genera un presupuesto con los servicios y costos correspondientes.
7. El cliente consulta el presupuesto y lo aprueba.
8. El mecánico realiza los trabajos autorizados y registra los servicios y repuestos utilizados.
9. El sistema actualiza el estado de la orden durante el proceso.
10. El mecánico finaliza la orden de trabajo.
11. El cliente puede consultar el estado final y el historial de la reparación.

## 6. Reglas de negocio

* Un usuario posee un único rol dentro del sistema.
* Un cliente puede tener uno o más vehículos registrados.
* Un vehículo pertenece a un único cliente.
* Un cliente solamente puede consultar y utilizar sus propios vehículos.
* Un cliente solamente puede solicitar turnos para vehículos que le pertenecen.
* Un turno debe estar asociado a un único vehículo.
* Un horario no puede tener dos turnos activos para la misma atención del taller.
* El mecánico puede modificar los datos de un vehículo cuando detecta información incorrecta o desactualizada.
* La patente debe ser única dentro de los vehículos registrados.
* Una orden de trabajo se genera a partir de la atención de un turno.
* Una orden de trabajo pertenece a un único vehículo.
* El diagnóstico de una orden solamente puede ser registrado o modificado por un mecánico.
* El presupuesto solamente puede ser generado o modificado por un mecánico.
* El cliente solamente puede consultar y aprobar presupuestos correspondientes a sus propios vehículos.
* Una orden puede contener múltiples servicios y un servicio puede formar parte de múltiples órdenes de trabajo.
* Una orden puede utilizar múltiples repuestos y un repuesto puede utilizarse en múltiples órdenes de trabajo.
* No se puede registrar el uso de una cantidad de repuestos superior al stock disponible.
* Una orden de trabajo finalizada debe conservarse como historial y no debe eliminarse físicamente del sistema.
* Un cliente no puede modificar información interna de una orden de trabajo, diagnóstico o presupuesto.
* Los datos del vehículo deben mantenerse actualizados cuando el mecánico detecte inconsistencias durante la atención.

## 7. Requisitos no funcionales

No son funcionalidades: son condiciones que todo el sistema tiene que cumplir.

### Usabilidad

* **Eficiencia:** la tarea principal de solicitar un turno se debe poder realizar en 5 interacciones principales o menos desde la sección de vehículos.
* **Errores:** si falta un campo obligatorio o se ingresa un dato inválido, se debe señalar el campo correspondiente y no se deben perder los datos ya cargados.
* **Aprendizaje:** una persona que nunca utilizó el sistema debe poder registrar un vehículo y solicitar un turno sin recibir instrucciones del equipo.
* **Recuerdo:** el acceso a vehículos y turnos debe mantenerse en el mismo lugar de navegación durante todo el uso del sistema.
* **Satisfacción:** se debe probar el flujo principal con al menos una persona externa al equipo antes del Demo Day y registrar los problemas encontrados.

### Accesibilidad

* [ ] Todo se puede operar **con el teclado**, y se ve dónde está el foco.
* [ ] Los campos de formulario tienen `label` asociado, no solo *placeholder*.
* [ ] Las imágenes que informan tienen texto alternativo; las decorativas, alternativo vacío.
* [ ] El **contraste** entre texto y fondo llega a **4,5:1** (3:1 si la letra es grande).
* [ ] El error nunca se comunica **solo con color**: siempre hay texto.

## 8. Integración externa

**Cuál:** servicio de envío de correo electrónico.

**Para qué:** enviar notificaciones al cliente relacionadas con eventos importantes del flujo, como la confirmación de un turno o la disponibilidad de un presupuesto.

**Qué pasa si se cae:** la operación principal no se cancela por la falla del servicio de correo. El sistema debe conservar el cambio realizado y permitir que el usuario consulte la información directamente desde la aplicación.

## 9. Fuera de alcance

Lo que decidimos **no** hacer durante el alcance actual del proyecto:

* Pagos online.
* Facturación electrónica.
* Gestión contable del taller.
* Integración con proveedores externos de repuestos.
* Chat en tiempo real entre cliente y mecánico.
* Aplicación móvil nativa.
* Geolocalización del vehículo.
* Gestión de múltiples sucursales.
* Sistema avanzado de estadísticas o reportes.
* Integración con compañías de seguros.
