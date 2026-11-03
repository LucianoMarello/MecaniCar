import type {
  EstadoOrdenTrabajo,
  EstadoPresupuesto,
  EstadoTurno,
} from "@prisma/client";
import { Badge } from "@/components/ui/badge";

type Estado = EstadoOrdenTrabajo | EstadoPresupuesto | EstadoTurno;
const presentacion = {
  PENDIENTE: { texto: "Pendiente", variante: "outline" },
  CONFIRMADO: { texto: "Confirmado", variante: "secondary" },
  CANCELADO: { texto: "Cancelado", variante: "destructive" },
  ABIERTA: { texto: "Abierta", variante: "outline" },
  EN_REPARACION: { texto: "En reparación", variante: "secondary" },
  FINALIZADA: { texto: "Finalizada", variante: "default" },
  APROBADO: { texto: "Aprobado", variante: "default" },
  RECHAZADO: { texto: "Rechazado", variante: "destructive" },
} as const satisfies Record<
  Estado,
  {
    texto: string;
    variante: "default" | "outline" | "secondary" | "destructive";
  }
>;

export function EstadoTrabajo({ estado }: { estado: Estado }) {
  const { texto, variante } = presentacion[estado];
  return <Badge variant={variante}>{texto}</Badge>;
}
