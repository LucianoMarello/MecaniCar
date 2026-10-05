# ADR 0003 — Identidad y sesión

**Estado:** aceptada
**Fecha:** 2026-09-25 (redactado el 2026-10-04)
**Decide:** equipo

---

## Contexto

Todas las operaciones de MecaniCar dependen de saber quién es el usuario y qué rol tiene: un cliente solo ve lo suyo y solo el mecánico hace avanzar la atención (`docs/spec.md`, sección 2 y 8.3).

Había que resolver tres cosas: cómo se identifica una persona, dónde se guarda su sesión y cómo aparece el primer mecánico, dado que toda persona nueva entra como Cliente (RN34).

La cátedra pedía resolver la identidad con Auth.js.

## Opciones consideradas

**Cómo se identifica el usuario**

| Opción | A favor | En contra |
|---|---|---|
| Solo Google | No guardamos contraseñas: no hay nada que cifrar, recuperar ni que pueda filtrarse. Menos código | Quien no tiene cuenta de Google no puede entrar. Si Google no responde, nadie inicia sesión |
| Email y contraseña propios | No depende de un tercero | Hay que guardar contraseñas cifradas y resolver su recuperación y su cambio |
| Mixto: Google para clientes, contraseña e invitación para mecánicos | El taller da de alta a sus mecánicos sin depender de sus cuentas de Google | Suma todo lo anterior: dos caminos de ingreso para mantener y probar |

El esquema mixto llegó a implementarse (migraciones `agrega_autenticacion_hibrida` y `agrega_invitaciones_mecanicos`) y se retiró dos días después (`simplifica_auth_google`).

**Dónde se guarda la sesión**

| Opción | A favor | En contra |
|---|---|---|
| En un token (JWT) dentro de una cookie | No necesita tablas de sesión ni una consulta para saber si la sesión existe | El contenido del token queda fijo hasta que vence |
| En la base de datos | Una sesión puede cerrarse desde el servidor en cualquier momento | Más tablas y un adaptador de Auth.js para mantener |

## Decisión

Elegimos **Google como único proveedor y la sesión en un token JWT**.

Porque para la primera entrega alcanzaba con un solo camino de ingreso, y es el que menos código y menos riesgo agrega. El ingreso con contraseña no quedó descartado para más adelante.

La decisión se completa así (`lib/auth.ts`):

1. **Tabla `Usuario` propia.** Auth.js no maneja nuestros usuarios: la primera vez que alguien entra con Google se crea su fila con rol `CLIENTE`. El vínculo con Google es el email, guardado en minúsculas.
2. **El rol no se confía al token.** Cada vez que se consulta la sesión, se vuelve a leer el usuario de la base por su email. Así se compensa la desventaja del JWT: un cambio de rol o una baja (`activo = false`) valen desde el siguiente request, sin esperar a que el token venza.
3. **La autorización se verifica en cada Route Handler** con `requerirUsuario`, nunca solo en la interfaz. Responde `401` sin sesión y `403` si el rol no alcanza. Un recurso de otro cliente responde `404`, igual que uno inexistente, para no revelar que existe.
4. **Rol Administrador.** Es un mecánico que además puede asignar roles (`docs/spec.md`, sección 2.3). Existe para dar de alta al primer mecánico. No se crea desde la aplicación: el seed lo carga con el correo de la variable `BOOTSTRAP_ADMIN_EMAIL`.

## Consecuencias

- No existe en el sistema ningún dato que sirva para entrar a la cuenta de un usuario en otro sitio.
- El alta de un mecánico tiene dos pasos: la persona inicia sesión con Google (queda como Cliente) y el Administrador le asigna el rol.
- Cada request con sesión hace una consulta extra a la base para leer el rol. Es el precio de que los cambios de rol sean inmediatos.
- Como el vínculo es el email, si una persona cambia de cuenta de Google pasa a ser un usuario nuevo.
- Hay un único Administrador y no puede cambiar su propio rol (RN36). Reemplazarlo requiere volver a correr el seed con otro correo.
- Si se retoma el ingreso con contraseña, hay que volver a agregar a `Usuario` las columnas que se quitaron y revisar este ADR.
- El rol Administrador se agregó al implementar la autenticación; la idea original eran dos roles. Si el equipo decide volver a dos, hay que definir otra forma de dar de alta al primer mecánico.
