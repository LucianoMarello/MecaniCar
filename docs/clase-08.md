# Clase 8: listado y detalle de vehículos

## Pantallas y ejecución

- `/vehiculos`: Server Component en `app/(app)/vehiculos/page.tsx`. Lee la sesión y llama directamente a `listarVehiculos(usuario.id, usuario.rol, paginacion)`.
- `/vehiculos/[id]`: Server Component que reutiliza `buscarVehiculo`, la misma función autorizada del endpoint. Un cliente solo accede a vehículos propios; Mecánico y Administrador consultan los del taller.
- `components/BuscadorVehiculos.tsx`: único componente de cliente nuevo. Necesita `useState` y `onChange` para filtrar por patente, marca o modelo sin requests por tecla.
- El `app/error.tsx` existente sigue siendo un Client Component por el botón Reintentar requerido por Next. No se agrega otro para gestionar errores.

Las páginas no hacen fetch a la API propia ni importan Prisma. Solo se envían al buscador id, patente, marca, modelo y año. Las fechas del detalle se formatean en el servidor con zona de Buenos Aires. La portada conserva los formularios de Google y cierre de sesión.

El listado mantiene la paginación de 20 vehículos. La búsqueda local solo filtra la página visible y lo aclara en pantalla. Una página con 20 registros permite avanzar; la siguiente puede estar vacía y permite volver. Los parámetros inválidos muestran la pantalla de no encontrado.

## Validación manual local y en producción

1. Iniciar sesión como Cliente A. Abrir Vehículos desde la portada y acceder al detalle de uno propio.
2. Escribir en el buscador y comprobar en Network que no se disparan solicitudes por cada tecla (la navegación a otra página o detalle sí realiza solicitudes de Next).
3. Copiar la URL del detalle y abrirla sin sesión en incógnito: debe redirigir al ingreso de Auth.js sin mostrar datos.
4. Iniciar sesión como Cliente B y abrir la misma URL: debe mostrar la misma página 404 que un identificador inexistente. Usar dos cuentas CLIENTE, no una cuenta del taller.
5. Iniciar sesión como Mecánico o Administrador: debe poder consultar los vehículos del taller.
6. Revisar lista vacía, búsqueda sin coincidencias, navegación con `?pagina=2`, y parámetros inválidos con `?pagina=0`.
7. Confirmar que no hay errores de hidratación y que fechas/horas se muestran en Buenos Aires.
8. Repetir los recorridos en la URL pública, verificar login Google, y solicitar revisión de la PR a otro integrante.

Las comprobaciones automáticas con mocks no reemplazan los pasos 1 a 8 contra las sesiones y la base reales. Esta entrega no cambia el modelo ni requiere migraciones.
