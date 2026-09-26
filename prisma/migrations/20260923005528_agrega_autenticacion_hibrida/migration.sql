-- CreateEnum
CREATE TYPE "ProveedorAutenticacion" AS ENUM ('GOOGLE', 'CREDENCIALES');

-- AlterEnum
ALTER TYPE "Rol" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imagen" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "passwordTemporalExpiraEn" TIMESTAMP(3),
ADD COLUMN     "proveedorAutenticacion" "ProveedorAutenticacion" NOT NULL DEFAULT 'GOOGLE',
ALTER COLUMN "apellido" DROP NOT NULL,
ALTER COLUMN "rol" SET DEFAULT 'CLIENTE',
ALTER COLUMN "telefono" DROP NOT NULL,
ALTER COLUMN "direccion" DROP NOT NULL;
