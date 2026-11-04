// Lo que una Server Action le devuelve a su formulario. Una sola forma para
// todos, así el componente Campo sabe mostrar los errores de cualquiera.
//   errores  validación de Zod, por campo: van debajo del campo (400 en la API)
//   mensaje  rechazo de una regla de negocio: va arriba del formulario (409)
//   valores  lo que la persona escribió, para no vaciarle el formulario
export type EstadoFormulario = {
  errores?: Record<string, string[] | undefined>;
  mensaje?: string;
  valores?: Record<string, string>;
};

export const SIN_ENVIAR: EstadoFormulario = {};

// Un campo vacío llega como "" y uno ausente como null; los dos quedan en "".
export function leerTexto(formData: FormData, nombre: string): string {
  const valor = formData.get(nombre);
  return typeof valor === "string" ? valor : "";
}
