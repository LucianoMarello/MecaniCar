DROP INDEX IF EXISTS "Usuario_tokenInvitacionHash_key";
ALTER TABLE "Usuario" DROP COLUMN IF EXISTS "proveedorAutenticacion", DROP COLUMN IF EXISTS "passwordHash", DROP COLUMN IF EXISTS "debeCambiarPassword", DROP COLUMN IF EXISTS "passwordTemporalExpiraEn", DROP COLUMN IF EXISTS "tokenInvitacionHash", DROP COLUMN IF EXISTS "invitacionExpiraEn";
DROP TYPE IF EXISTS "ProveedorAutenticacion";
