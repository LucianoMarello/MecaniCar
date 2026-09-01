# Especificación del sistema

> Este documento es el relevamiento de requerimientos del proyecto (eje metodológico, clase 2).
>
> Se completa en la clase 2 y se mantiene actualizado todo el cuatrimestre.
>
> Regla práctica: si una funcionalidad no está acá, no se implementa.

---

## 1. El problema

**Para quién:**  
MecaniCar está destinado a talleres mecánicos que necesitan organizar la atención de sus clientes y vehículos, y a los clientes que necesitan solicitar turnos y consultar el estado de los trabajos realizados sobre sus vehículos.

**Qué hace hoy sin el sistema:**  
La gestión de clientes, vehículos, turnos, diagnósticos y presupuestos puede realizarse mediante anotaciones en papel, planillas, mensajes de WhatsApp u otros medios separados, dificultando el seguimiento de cada reparación, el control de los repuestos utilizados y la comunicación con el cliente.

**Qué mejora:**  
MecaniCar centraliza la información de clientes y vehículos y permite gestionar el flujo de atención desde la solicitud del turno hasta la generación y aprobación del presupuesto, la reparación y la finalización de la orden de trabajo.

---

## 2. Roles

| Rol | Quién es | Qué puede hacer que el otro no |
|---|---|---|
| Cliente | Persona que lleva uno o más vehículos al taller. | Puede registrar y consultar sus vehículos, solicitar turnos, consultar el estado de sus órdenes de trabajo y aprobar o rechazar presupuestos asociados a sus vehículos. |
| Mecánico | Personal del taller encargado de recibir vehículos, diagnosticar problemas y realizar los trabajos. | Puede gestionar turnos, crear órdenes de trabajo, registrar diagnósticos, corregir datos de los vehículos, generar presupuestos, gestionar servicios y repuestos y registrar movimientos de stock. |

---

## 3. Entidades

Los sustantivos que aparecen en las historias de usuario. De acá sale el modelo de datos.

| Entidad | Qué representa | Se relaciona con |
|---|---|---|
| Usuario | Persona que utiliza el sistema y posee un rol dentro de MecaniCar. | Vehículo |
| Vehículo | Automóvil que pertenece a un cliente y puede ingresar al taller. | Usuario, Turno |
| Turno | Solicitud de atención para un vehículo en una fecha y horario determinados. | Vehículo, Orden de Trabajo |
| Orden de Trabajo | Registro de la atención y reparación realizada sobre un vehículo. Contiene el diagnóstico como información propia. | Turno, Presupuesto, Movimiento de Stock |
| Presupuesto | Propuesta económica de reparación asociada a una orden de trabajo. | Orden de Trabajo, Servicio, Repuesto |
| Servicio | Trabajo que puede realizar el taller, por ejemplo cambio de aceite, alineación o reparación de frenos. | Presupuesto |
| Repuesto | Elemento que puede ser utilizado durante una reparación y formar parte del stock del taller. | Presupuesto, Proveedor, Movimiento de Stock |
| Proveedor | Proveedor habitual de los repuestos utilizados por el taller. | Repuesto |
| Movimiento de Stock | Registro de una entrada, salida o ajuste de stock de un repuesto. | Repuesto, Orden de Trabajo |

### Entidades asociativas

Además de las entidades principales, el sistema utilizará entidades asociativas para representar relaciones de muchos a muchos:

- `PresupuestoServicio`
- `PresupuestoRepuesto`

### Decisión sobre el diagnóstico

El diagnóstico no se modelará como una entidad independiente.

El diagnóstico será un atributo de `OrdenTrabajo`, ya que en el alcance actual representa una descripción del resultado de la revisión realizada por el mecánico y no necesita identidad, relaciones ni ciclo de vida propios.

De esta forma, se evita agregar una entidad que no aporta funcionalidad independiente al sistema.

---

## 4. Historias de usuario

Formato: **Como** <rol>, **quiero** <acción>, **para** <beneficio>.

Cada historia lleva sus criterios de aceptación: cómo se verifica que está terminada.

### H1 — Registrar vehículo

**Como** cliente, **quiero** registrar un vehículo, **para** poder solicitar turnos para llevarlo al taller.

Criterios de aceptación:

- [ ] Dado que el cliente está autenticado, cuando completa los datos obligatorios del vehículo, entonces el sistema registra el vehículo asociado a ese cliente.
- [ ] Dado que falta un dato obligatorio, cuando el cliente intenta guardar el vehículo, entonces el sistema informa el campo faltante y conserva los datos que ya fueron ingresados.
- [ ] Caso de error: cuando la patente ya está registrada para otro vehículo, el sistema rechaza el registro e informa el conflicto.
- [ ] El vehículo queda asociado al cliente autenticado y no puede ser asociado a otro cliente desde este flujo.

### H2 — Consultar vehículos

**Como** cliente, **quiero** consultar mis vehículos registrados, **para** conocer qué vehículos tengo asociados al sistema.

Criterios de aceptación:

- [ ] Dado que el cliente está autenticado, cuando accede a sus vehículos, entonces solamente puede visualizar los vehículos asociados a su cuenta.
- [ ] Se muestran como mínimo la patente, marca, modelo y año.
- [ ] Caso de error: un cliente no puede visualizar información de vehículos pertenecientes a otro cliente.

### H3 — Corregir datos del vehículo

**Como** mecánico, **quiero** modificar los datos de un vehículo, **para** corregir información incorrecta o desactualizada detectada durante la atención en el taller.

Criterios de aceptación:

- [ ] Dado que el mecánico está autenticado, cuando modifica los datos de un vehículo y guarda los cambios, entonces el sistema actualiza la información.
- [ ] El mecánico puede corregir datos como patente, marca, modelo y año.
- [ ] Caso de error: cuando el mecánico intenta asignar una patente que ya pertenece a otro vehículo, el sistema rechaza la modificación e informa el conflicto.
- [ ] El mecánico no puede modificar el cliente propietario del vehículo.
- [ ] Un cliente no puede modificar datos de un vehículo perteneciente a otro cliente.

### H4 — Solicitar turno

**Como** cliente, **quiero** solicitar un turno para uno de mis vehículos, **para** llevarlo al taller.

Criterios de aceptación:

- [ ] Dado que el cliente está autenticado y posee un vehículo registrado, cuando selecciona el vehículo, fecha y horario disponibles, entonces el sistema registra el turno.
- [ ] El turno queda asociado al vehículo seleccionado y, mediante este, al cliente correspondiente.
- [ ] El cliente debe indicar el motivo de la consulta.
- [ ] El turno queda inicialmente en estado `PENDIENTE`.
- [ ] Caso de error: cuando el horario seleccionado no está disponible, el sistema rechaza la solicitud y solicita elegir otro horario.
- [ ] Caso de error: un cliente no puede solicitar un turno utilizando un vehículo que no le pertenece.

### H5 — Gestionar turnos

**Como** mecánico, **quiero** consultar y gestionar los turnos solicitados, **para** organizar la atención del taller.

Criterios de aceptación:

- [ ] Dado que el mecánico está autenticado, cuando accede a los turnos, entonces puede consultar los turnos solicitados por los clientes.
- [ ] Los turnos muestran como mínimo el vehículo, cliente, fecha, horario y estado.
- [ ] El mecánico puede confirmar un turno pendiente.
- [ ] El mecánico puede cancelar un turno cuando corresponda.
- [ ] El mecánico puede marcar un turno como atendido cuando el vehículo ingresa al taller.

### H6 — Crear orden de trabajo

**Como** mecánico, **quiero** crear una orden de trabajo asociada a un turno, **para** registrar formalmente la atención y reparación del vehículo.

Criterios de aceptación:

- [ ] Dado que existe un turno correspondiente a un vehículo, cuando el mecánico inicia la atención, entonces puede generar una orden de trabajo asociada a ese turno.
- [ ] La orden de trabajo queda asociada al turno y, por medio de este, al vehículo correspondiente.
- [ ] Un mismo turno no puede generar más de una orden de trabajo dentro del alcance actual.
- [ ] La orden posee un estado que permite conocer su progreso.
- [ ] La orden comienza en estado `ABIERTA`.

### H7 — Registrar diagnóstico

**Como** mecánico, **quiero** registrar el diagnóstico de una orden de trabajo, **para** documentar los problemas detectados en el vehículo.

Criterios de aceptación:

- [ ] Dado que existe una orden de trabajo, cuando el mecánico registra el diagnóstico, entonces el sistema lo almacena en la orden correspondiente.
- [ ] El diagnóstico debe contener una descripción de los problemas detectados.
- [ ] El diagnóstico forma parte de la información de la orden de trabajo y no requiere una entidad independiente.
- [ ] Un cliente no puede modificar el diagnóstico registrado por el mecánico.

### H8 — Generar presupuesto

**Como** mecánico, **quiero** generar un presupuesto para una orden de trabajo, **para** informar al cliente los trabajos y costos estimados.

Criterios de aceptación:

- [ ] Dado que existe una orden de trabajo con un diagnóstico, cuando el mecánico genera un presupuesto, entonces este queda asociado a la orden correspondiente.
- [ ] El presupuesto puede incluir uno o varios servicios.
- [ ] El presupuesto puede incluir uno o varios repuestos.
- [ ] Los repuestos se asocian directamente al presupuesto y no a un servicio específico.
- [ ] El presupuesto conserva la cantidad y el precio utilizado de cada servicio y repuesto.
- [ ] El total del presupuesto se calcula a partir de los conceptos incluidos.
- [ ] El presupuesto comienza en estado `PENDIENTE`.
- [ ] Caso de error: el sistema no permite generar un presupuesto sin asociarlo a una orden de trabajo.
- [ ] Una orden de trabajo no puede tener más de un presupuesto dentro del alcance actual.

### H9 — Aprobar o rechazar presupuesto

**Como** cliente, **quiero** consultar y aprobar o rechazar un presupuesto, **para** decidir si autorizo al taller a realizar los trabajos propuestos.

Criterios de aceptación:

- [ ] Dado que existe un presupuesto asociado a un vehículo del cliente, cuando el cliente lo consulta, entonces puede visualizar los trabajos y costos propuestos.
- [ ] El cliente puede aprobar un presupuesto que se encuentre en estado `PENDIENTE`.
- [ ] El cliente puede rechazar un presupuesto que se encuentre en estado `PENDIENTE`.
- [ ] Cuando el cliente aprueba el presupuesto, entonces el sistema registra la aprobación y la orden puede continuar con la reparación.
- [ ] Cuando el cliente rechaza el presupuesto, entonces el sistema registra el rechazo y no se habilita la reparación.
- [ ] Caso de error: un cliente no puede aprobar o rechazar un presupuesto que pertenece a otro cliente.
- [ ] Un presupuesto aprobado no puede volver a aprobarse o rechazarse.
- [ ] Un presupuesto rechazado no puede volver a aprobarse o rechazarse.

### H10 — Gestionar servicios

**Como** mecánico, **quiero** gestionar los servicios ofrecidos por el taller, **para** poder incluirlos en los presupuestos.

Criterios de aceptación:

- [ ] El mecánico puede registrar un nuevo servicio.
- [ ] El mecánico puede modificar el nombre, descripción y precio base de un servicio.
- [ ] El mecánico puede activar o desactivar un servicio.
- [ ] Un servicio puede formar parte de diferentes presupuestos.
- [ ] El precio utilizado en un presupuesto se conserva aunque posteriormente cambie el precio base del servicio.
- [ ] Desactivar un servicio no elimina su utilización histórica en presupuestos existentes.

### H11 — Gestionar repuestos

**Como** mecánico, **quiero** gestionar los repuestos disponibles, **para** poder incluirlos en presupuestos y controlar el stock del taller.

Criterios de aceptación:

- [ ] El mecánico puede registrar un repuesto.
- [ ] El mecánico puede modificar los datos del repuesto.
- [ ] El mecánico puede establecer su precio de referencia y stock mínimo.
- [ ] El mecánico puede asociar un repuesto a un proveedor.
- [ ] Un repuesto puede formar parte de diferentes presupuestos.
- [ ] Un repuesto no necesita estar asociado a un servicio específico.

### H12 — Registrar repuestos en un presupuesto

**Como** mecánico, **quiero** agregar repuestos a un presupuesto, **para** incluir los componentes necesarios para realizar la reparación.

Criterios de aceptación:

- [ ] Dado que existe un presupuesto, cuando el mecánico selecciona un repuesto, entonces este queda asociado al presupuesto.
- [ ] El mecánico puede indicar la cantidad del repuesto.
- [ ] Se almacena el precio utilizado en el presupuesto.
- [ ] El precio histórico del presupuesto no cambia si posteriormente cambia el precio del repuesto.
- [ ] Caso de error: no se permite registrar una cantidad igual o menor a cero.
- [ ] Un repuesto puede aparecer en distintos presupuestos.

### H13 — Gestionar proveedores

**Como** mecánico, **quiero** registrar y asociar proveedores a los repuestos, **para** conocer el proveedor habitual de cada repuesto.

Criterios de aceptación:

- [ ] El mecánico puede registrar un proveedor.
- [ ] El proveedor posee como mínimo un nombre.
- [ ] El mecánico puede asociar un repuesto a un proveedor.
- [ ] Un proveedor puede estar asociado a varios repuestos.
- [ ] No se gestionan órdenes de compra, facturas ni pagos a proveedores.

### H14 — Registrar movimientos de stock

**Como** mecánico, **quiero** registrar movimientos de stock, **para** mantener actualizada la cantidad disponible de cada repuesto.

Criterios de aceptación:

- [ ] El mecánico puede registrar una entrada de stock.
- [ ] El mecánico puede registrar una salida de stock.
- [ ] El mecánico puede registrar un ajuste de stock.
- [ ] El movimiento indica el tipo, cantidad, fecha y motivo.
- [ ] Una salida de stock correspondiente a una reparación puede asociarse a la orden de trabajo correspondiente.
- [ ] Cuando se registra una salida, el stock disponible se actualiza.
- [ ] Caso de error: el sistema no permite realizar una salida superior al stock disponible.
- [ ] Una entrada o ajuste puede realizarse sin asociarse a una orden de trabajo.

### H15 — Consultar stock

**Como** mecánico, **quiero** consultar el stock de repuestos, **para** conocer qué elementos están disponibles para realizar reparaciones.

Criterios de aceptación:

- [ ] El mecánico puede consultar los repuestos registrados.
- [ ] Se muestra la cantidad disponible.
- [ ] Se muestra el stock mínimo configurado.
- [ ] El sistema permite identificar repuestos cuyo stock se encuentra por debajo del mínimo.
- [ ] La información corresponde al stock actualizado.

### H16 — Consultar estado de la orden

**Como** cliente, **quiero** consultar el estado de la orden de trabajo de mi vehículo, **para** conocer el avance de la reparación.

Criterios de aceptación:

- [ ] Dado que el cliente está autenticado, cuando consulta una orden de su vehículo, entonces puede visualizar su estado actual.
- [ ] El cliente puede consultar únicamente órdenes asociadas a sus propios vehículos.
- [ ] El sistema muestra el estado actualizado de la orden.
- [ ] El cliente puede consultar el diagnóstico de su orden cuando corresponda.
- [ ] El cliente puede consultar el presupuesto asociado cuando exista.
- [ ] El cliente no puede modificar información interna de la orden.

---

## 5. Flujo principal

El recorrido completo, paso a paso, del flujo que da valor al sistema.

El flujo principal de MecaniCar es el recorrido de un vehículo desde la solicitud de atención hasta la finalización del trabajo.

1. El cliente inicia sesión.
2. El cliente registra un vehículo o selecciona uno que ya tiene registrado.
3. El cliente solicita un turno indicando el vehículo, fecha, horario y motivo de la consulta.
4. El mecánico consulta los turnos y gestiona la solicitud.
5. Cuando el vehículo ingresa al taller, el mecánico genera una orden de trabajo asociada al turno.
6. El mecánico registra el diagnóstico de la orden de trabajo.
7. El mecánico genera un presupuesto asociado a la orden de trabajo.
8. El presupuesto contiene los servicios y repuestos necesarios, junto con sus cantidades y precios.
9. El cliente consulta el presupuesto.
10. El cliente aprueba o rechaza el presupuesto.
11. Si el cliente aprueba el presupuesto, la orden pasa a la etapa de reparación.
12. El mecánico realiza los trabajos autorizados.
13. El mecánico registra los repuestos utilizados y los movimientos de stock correspondientes.
14. El estado de la orden se actualiza durante el proceso.
15. Cuando finaliza la reparación, el mecánico marca la orden como `FINALIZADA`.
16. El cliente puede consultar el estado final y la información de la reparación.

### Flujo alternativo: presupuesto rechazado

1. El cliente consulta el presupuesto.
2. El cliente selecciona rechazar.
3. El sistema registra el presupuesto como `RECHAZADO`.
4. La reparación no queda habilitada.
5. La orden puede quedar en estado `CANCELADA`.

## 6. Reglas de negocio

- Cada usuario tiene un único rol: `CLIENTE` o `MECANICO`.
- Un cliente puede registrar varios vehículos.
- Cada vehículo pertenece a un único cliente.
- El cliente solamente puede consultar y gestionar sus propios vehículos.
- La patente de un vehículo debe ser única dentro del sistema.
- El mecánico puede corregir los datos de un vehículo (patente, marca, modelo y año) si fueron ingresados incorrectamente.
- El mecánico no puede modificar el cliente propietario del vehículo.
- Un turno pertenece a un único vehículo.
- Un cliente solamente puede solicitar turnos para vehículos de su propiedad.
- No se permite registrar dos turnos activos para el mismo horario.
- Un turno puede generar como máximo una orden de trabajo.
- La orden de trabajo se genera a partir de un turno existente.
- Una orden de trabajo pertenece a un único turno.
- El diagnóstico se almacena como un atributo de la orden de trabajo y no como una entidad independiente.
- Solamente el mecánico puede registrar o modificar el diagnóstico de una orden de trabajo.
- Una orden de trabajo puede tener como máximo un presupuesto.
- El presupuesto pertenece a una única orden de trabajo.
- Solamente el mecánico puede crear o modificar un presupuesto.
- Un presupuesto puede incluir varios servicios y varios repuestos.
- La relación entre presupuesto y servicio se resuelve mediante `PresupuestoServicio`.
- La relación entre presupuesto y repuesto se resuelve mediante `PresupuestoRepuesto`.
- Los repuestos se asocian directamente al presupuesto y no al servicio, ya que un mismo servicio puede requerir distintos repuestos según el vehículo o la reparación.
- La cantidad de servicios o repuestos incluida en un presupuesto debe ser mayor que cero.
- El precio de un servicio o repuesto utilizado en un presupuesto debe conservarse como precio histórico, independientemente de futuras modificaciones en el catálogo.
- Un cliente solamente puede consultar los presupuestos correspondientes a sus propios vehículos.
- Solamente el cliente propietario del vehículo puede aprobar o rechazar el presupuesto.
- Un presupuesto solamente puede ser aprobado o rechazado mientras se encuentre en estado `PENDIENTE`.
- Una vez aprobado o rechazado, el presupuesto no puede volver a modificarse ni cambiar de decisión.
- Si el presupuesto es aprobado, la orden de trabajo puede pasar al estado `EN_REPARACION`.
- Si el presupuesto es rechazado, no se habilita la ejecución de la reparación presupuestada y la orden puede finalizar como cancelada.
- Una orden de trabajo puede utilizar varios repuestos.
- Un mismo repuesto puede ser utilizado en distintas órdenes de trabajo.
- Los movimientos de stock pueden ser de tipo `ENTRADA`, `SALIDA` o `AJUSTE`.
- Todo movimiento de stock debe registrar una cantidad, una fecha y un motivo.
- Un movimiento de stock de salida no puede provocar que el stock disponible quede por debajo de cero.
- Un movimiento de stock puede estar asociado a una orden de trabajo cuando corresponde a un repuesto utilizado durante una reparación.
- Cada repuesto puede estar asociado a un proveedor.
- Un proveedor puede estar asociado a varios repuestos.
- El proveedor se utiliza únicamente para identificar el origen del repuesto. No se implementará un sistema de compras.
- No se registrarán órdenes de compra, facturas de proveedores ni pagos a proveedores.
- Las órdenes de trabajo finalizadas deben conservarse para mantener el historial de reparaciones.
- Las operaciones que involucren información privada o modificaciones de datos deben requerir autenticación y autorización según el rol del usuario.
- Las validaciones importantes deben realizarse en el servidor y no depender únicamente de la interfaz.

## 7. Requisitos no funcionales

### Usabilidad

- El sistema debe permitir que un cliente registre un vehículo y solicite un turno de manera sencilla.
- Desde la sección de vehículos, el cliente debería poder completar la solicitud de un turno en un máximo de 5 interacciones principales, sin contar la carga de los datos.
- Los errores de validación deben mostrarse junto al campo correspondiente y mediante mensajes comprensibles.
- Ante un error de validación, el sistema debe conservar los datos que el usuario ya había ingresado siempre que sea posible.
- Un usuario que utilice el sistema por primera vez debe poder registrar un vehículo y solicitar un turno sin necesitar instrucciones externas.
- La navegación entre vehículos, turnos, presupuestos y órdenes de trabajo debe mantener una estructura consistente.

### Seguridad

- Las funcionalidades privadas deben requerir autenticación.
- Las acciones disponibles deben depender del rol del usuario.
- Las operaciones sensibles deben validar los permisos del usuario en el servidor.
- Un cliente no debe poder consultar ni modificar información perteneciente a otro cliente.
- Los datos recibidos desde formularios deben validarse del lado del servidor.
- Las operaciones que modifiquen información deben verificar que el usuario tenga permisos sobre los datos involucrados.

### Persistencia

- La información del sistema debe almacenarse en una base de datos PostgreSQL.
- El acceso a los datos debe realizarse mediante Prisma.
- Los cambios en la estructura de la base de datos deben gestionarse mediante migraciones versionadas.
- Las migraciones necesarias para ejecutar el proyecto deben formar parte del repositorio.

### Consistencia de datos

- Las operaciones que impliquen múltiples modificaciones relacionadas deben mantener la consistencia de los datos.
- No se debe permitir que el stock de un repuesto quede en valores negativos.
- Las relaciones entre turnos, órdenes de trabajo y presupuestos deben respetar las reglas definidas.
- Los precios utilizados en presupuestos deben conservarse como valores históricos.
- No se deben eliminar registros históricos de órdenes de trabajo finalizadas de manera que se pierda información de reparaciones anteriores.

## 8. Accesibilidad

- [ ] Todo elemento interactivo debe poder utilizarse mediante teclado y debe contar con un indicador de foco visible.
- [ ] Los campos de los formularios deben contar con etiquetas asociadas correctamente y no depender únicamente del placeholder.
- [ ] Las imágenes informativas deben contar con texto alternativo y las imágenes decorativas deben utilizar un texto alternativo vacío.
- [ ] El contraste entre texto y fondo debe cumplir como mínimo una relación de 4.5:1 para texto normal y 3:1 para texto grande.
- [ ] Los errores no deben comunicarse únicamente mediante color; deben acompañarse siempre de un mensaje textual.

## 9. Integración externa

Se utilizará un servicio externo de correo electrónico para enviar notificaciones relacionadas con el funcionamiento del sistema.

Las notificaciones podrán utilizarse para informar:

- Confirmación de un turno.
- Disponibilidad de un presupuesto.
- Aprobación o rechazo de un presupuesto.
- Finalización de una orden de trabajo.

La integración con el servicio de correo será considerada secundaria respecto de la operación principal del sistema.

Si el servicio de correo no se encuentra disponible, la operación principal no debe cancelarse por ese motivo. La información debe quedar almacenada correctamente en el sistema y continuar disponible para el usuario desde la aplicación.

## 10. Fuera de alcance

Las siguientes funcionalidades no forman parte del alcance del proyecto:

- Pagos online.
- Facturación electrónica.
- Contabilidad.
- Gestión de cuentas corrientes de clientes.
- Órdenes de compra a proveedores.
- Facturas de proveedores.
- Gestión avanzada de compras.
- Pagos a proveedores.
- Integración externa con sistemas de proveedores.
- Chat en tiempo real entre cliente y mecánico.
- Aplicación móvil nativa.
- Geolocalización.
- Gestión de múltiples sucursales.
- Gestión de múltiples depósitos.
- Estadísticas y reportes avanzados.
- Integración con compañías de seguros.
- Gestión de siniestros.
- Gestión de aseguradoras.
- Mantenimiento predictivo.
- Consulta automática de información del vehículo mediante servicios externos.
- Seguimiento de envíos de repuestos.
- Historial de diagnósticos como entidades independientes.
- Gestión de abastecimiento automático de repuestos.
- Gestión de órdenes de compra.
- Gestión de pagos o documentación de proveedores.

El sistema solamente contemplará una gestión básica de proveedores para identificar el origen de los repuestos y una gestión básica de stock mediante movimientos de entrada, salida y ajuste.