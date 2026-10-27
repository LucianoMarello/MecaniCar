import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { EstadoTrabajo } from "@/components/EstadoTrabajo";
import { SinDatos } from "@/components/SinDatos";
import { MensajeError } from "@/components/MensajeError";
import { CargandoVehiculos } from "@/components/CargandoVehiculos";
import { CargandoDetalleVehiculo } from "@/components/CargandoDetalleVehiculo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const variantes = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;
const estados = {
  Turnos: ["PENDIENTE", "CONFIRMADO", "CANCELADO"],
  "Órdenes de trabajo": ["ABIERTA", "EN_REPARACION", "FINALIZADA"],
  Presupuestos: ["PENDIENTE", "APROBADO", "RECHAZADO"],
} as const;

export default async function Sistema() {
  if (!(await obtenerUsuario())) redirect("/ingresar");
  return (
    <main id="contenido" className="min-w-0 space-y-8">
      <EncabezadoPagina
        titulo="Guía visual"
        descripcion="Galería de componentes y estados. Los datos son ejemplos y no modifican la información del taller."
        volver={{ href: "/vehiculos", texto: "Vehículos" }}
      />
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Botones y enlaces</h2>
          </CardTitle>
          <CardDescription>
            Ejemplos de apariencia; estos botones no ejecutan operaciones del
            taller. Usá Tab para revisar el foco.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {variantes.map((variant) => (
              <Button
                key={variant}
                type="button"
                variant={variant}
                className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                {variant}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled type="button">
              Deshabilitado
            </Button>
            <Button
              asChild
              variant="outline"
              className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <Link href="/vehiculos">Enlace a vehículos</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            El botón deshabilitado se omite al navegar con Tab, como corresponde
            a un control no disponible.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Indicadores de estado</h2>
          </CardTitle>
          <CardDescription>
            Cada estado tiene texto: el color nunca es la única señal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {Object.entries(estados).map(([grupo, valores]) => (
            <section key={grupo} className="space-y-2">
              <h3 className="font-semibold">{grupo}</h3>
              <div className="flex flex-wrap gap-2">
                {valores.map((estado) => (
                  <EstadoTrabajo key={estado} estado={estado} />
                ))}
              </div>
            </section>
          ))}
          <div
            className="flex flex-wrap gap-2"
            aria-label="Variantes visuales de insignias"
          >
            {variantes.map((variant) => (
              <Badge key={variant} variant={variant}>
                {variant}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Roles">
            <Badge variant="secondary">Cliente</Badge>
            <Badge variant="secondary">Mecánico</Badge>
            <Badge variant="secondary">Administrador</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Campos de entrada</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="ejemplo-normal" className="block font-medium">
              Campo normal
            </label>
            <Input
              id="ejemplo-normal"
              placeholder="Patente, marca o modelo"
              className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="ejemplo-deshabilitado"
              className="block font-medium"
            >
              Campo deshabilitado
            </label>
            <Input
              id="ejemplo-deshabilitado"
              disabled
              placeholder="No disponible"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="ejemplo-invalido" className="block font-medium">
              Campo con error de ejemplo
            </label>
            <Input
              id="ejemplo-invalido"
              aria-invalid="true"
              aria-describedby="error-ejemplo"
              defaultValue="Ejemplo inválido"
              className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            />
            <p id="error-ejemplo" className="text-sm text-destructive">
              Revisá el dato ingresado. Este mensaje es una muestra visual.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="ejemplo-largo" className="block font-medium">
              Campo con texto largo
            </label>
            <Input
              id="ejemplo-largo"
              defaultValue="Vehículo de ejemplo con una descripción extensa para comprobar el ancho del campo en dispositivos pequeños"
              className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            />
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4" aria-labelledby="datos-ejemplo">
        <h2 id="datos-ejemplo" className="text-xl font-bold">
          Con datos y con texto largo
        </h2>
        <Card size="sm">
          <CardHeader>
            <CardTitle>ABC123 · Vehículo de ejemplo</CardTitle>
            <CardDescription>Tarjeta compacta</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Toyota Corolla · Año 2022</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <h3 className="break-words [overflow-wrap:anywhere]">
                Vehículo de demostración con una descripción deliberadamente
                extensa para revisar que los títulos no se corten en una
                pantalla de 375 píxeles
              </h3>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="break-words [overflow-wrap:anywhere]">
              REFERENCIAEXTENSA1234567890SINESPACIOSPARAVERIFICARQUEELCONTENIDONOPROVOQUEDESPLAZAMIENTOHORIZONTAL
            </p>
            <p>
              Los textos deben ajustarse al ancho disponible sin tapar otros
              elementos.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4" aria-labelledby="vacios">
        <h2 id="vacios" className="text-xl font-bold">
          Vacío y sin resultados
        </h2>
        <SinDatos
          titulo="Todavía no hay vehículos"
          descripcion="Cuando haya vehículos registrados, aparecerán en esta sección. Podés volver a consultarla más adelante."
        />
        <SinDatos
          titulo="No hay coincidencias"
          descripcion="Hay vehículos, pero ninguno coincide con la búsqueda. Probá otro texto o limpiá el campo."
        />
      </section>
      <section className="space-y-4" aria-labelledby="avisos">
        <h2 id="avisos" className="text-xl font-bold">
          Avisos y error
        </h2>
        <Alert>
          <AlertTitle>Información de ejemplo</AlertTitle>
          <AlertDescription>
            El contenido de esta guía no representa operaciones reales.
          </AlertDescription>
        </Alert>
        <MensajeError />
      </section>
      <section className="space-y-4" aria-labelledby="carga-listado">
        <h2 id="carga-listado" className="text-xl font-bold">
          Cargando: listado
        </h2>
        <CargandoVehiculos />
      </section>
      <section className="space-y-4" aria-labelledby="carga-detalle">
        <h2 id="carga-detalle" className="text-xl font-bold">
          Cargando: detalle
        </h2>
        <CargandoDetalleVehiculo />
      </section>
    </main>
  );
}
