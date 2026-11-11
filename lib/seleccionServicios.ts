export function actualizarSeleccionServicios(
  actuales: Set<string>,
  id: string,
  checked: boolean,
) {
  const siguiente = new Set(actuales);
  if (checked) siguiente.add(id);
  else siguiente.delete(id);
  return siguiente;
}
