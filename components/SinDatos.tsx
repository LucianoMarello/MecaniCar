import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SinDatos({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion: string;
  children?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="break-words [overflow-wrap:anywhere]">{titulo}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 break-words [overflow-wrap:anywhere]">
        <p role="status" className="text-muted-foreground">
          {descripcion}
        </p>
        {children}
      </CardContent>
    </Card>
  );
}
