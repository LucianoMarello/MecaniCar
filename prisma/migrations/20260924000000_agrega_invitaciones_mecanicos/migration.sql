ALTER TABLE "Usuario"
ADD COLUMN "tokenInvitacionHash" TEXT,
ADD COLUMN "invitacionExpiraEn" TIMESTAMP(3);

CREATE UNIQUE INDEX "Usuario_tokenInvitacionHash_key"
ON "Usuario"("tokenInvitacionHash");
