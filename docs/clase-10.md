# Clase 10 — interfaz y componentes compartidos

## Recorrido inicial y problemas corregidos

La portada mezclaba ingreso, sesión y presentación del proyecto. El listado y el detalle no tenían una barra persistente. Bordes, radios y botones se repetían. La carga solo decía "Cargando" y no anticipaba el espacio del contenido. Había mensajes distintos para lista vacía y búsqueda sin coincidencias, pero no un componente compartido ni una galería para revisar variantes.

## Implementación

- El primer commit instala shadcn/ui (Radix Nova): Button, Card, Badge, Input, Skeleton y Alert. Los tokens y la fuente se conservan en la configuración generada por la CLI.
- `docs/spec.md`, sección 5: mapa de pantallas, roles y pasos del flujo, distinguiendo lo implementado, lo pendiente y los eventos sin pantalla independiente.
- `/`: portada pública; quien ya tiene sesión pasa a `/vehiculos`.
- `/ingresar`: ingreso con Google. El callback OAuth sigue siendo el de Auth.js; no cambian las credenciales ni los permisos.
- `app/(app)/layout.tsx`: barra con nombre del sistema, usuario, rol, enlaces y cierre de sesión. El layout redirige al ingreso, pero no sustituye los controles de cada página y de `lib/db/`.
- `/vehiculos` y `/vehiculos/[id]`: reutilizan las consultas autorizadas y las rutas de clase 8. El buscador filtra los 20 registros de la página visible sin requests por tecla.
- Los bordes y radios de las pantallas se delegan a los componentes compartidos de `components/ui/`. No se agregan hojas de estilo ni valores inline.
- `loading.tsx` del listado y del detalle usa esqueletos distintos, con texto para lectores de pantalla y respeto de movimiento reducido.
- `error.tsx` privado mantiene la barra y usa un mensaje genérico con Reintentar; el error raíz cubre fallos por encima de ese límite.
- Los 404 del detalle usan el mismo texto para recurso inexistente y ajeno, con enlace al listado. Las fechas se formatean en el servidor, en Buenos Aires.
- `/sistema`: galería detrás de sesión. Muestra variantes de componentes, estados del dominio con palabra visible, vacío, sin coincidencias, error y esqueletos; incluye textos largos. Son ejemplos fijos, no registros ni escrituras en la base.

No se agregan formularios del negocio, endpoints, migraciones ni reglas de autorización. Las Server Actions de ingreso/salida conservan la autenticación existente.

## Pruebas manuales pendientes de registrar

1. Iniciar sesión como Cliente y como Mecánico/Administrador. Revisar nombre/rol, alcance del listado y detalle. Intentar una URL ajena con otro CLIENTE: mismo 404 que un ID inexistente.
2. Abrir `/vehiculos` y `/sistema` sin sesión: redirección a `/ingresar`. Ingresar y salir sin bucles ni errores del callback de Google.
3. Probar lista vacía y búsqueda sin coincidencias. Limpiar la búsqueda y verificar que vuelven los datos. Revisar que no hay requests por cada tecla.
4. Recorrer con Tab/Shift+Tab/Enter: salto al contenido, barra, enlaces, buscador, limpiar búsqueda, paginación, detalle y salida. El foco debe ser visible.
5. Repetir en 375 px, especialmente `/sistema`, textos largos y nombres extensos. No debe haber contenido cortado ni scroll horizontal.
6. En DevTools, limitar la velocidad de red para observar la carga durante navegación. Revisar también los dos esqueletos de la galería sin demoras artificiales en el código.
7. En un entorno de prueba local, simular una consulta fallida sin tocar la base compartida ni los datos: verificar que la barra permanece, el error no se confunde con vacío y Reintentar recupera la pantalla al restablecer el servicio.
8. Revisar contraste con los colores finales en el inspector: texto normal >= 4,5:1 y texto grande >= 3:1; estados con texto y foco visible.
9. Repetir en la URL pública y pedir revisión cruzada a otro integrante. No declarar terminada la entrega con solo tests que usan mocks.

El flujo de escritura completo y sus formularios queda marcado como pendiente en el mapa de pantallas para la clase siguiente.
