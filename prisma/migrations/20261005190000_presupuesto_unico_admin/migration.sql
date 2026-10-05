-- No se descarta historial: si hay duplicados, resolverlos antes de aplicar.
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM "Presupuesto" GROUP BY "ordenTrabajoId" HAVING COUNT(*) > 1) THEN
  RAISE EXCEPTION 'Hay órdenes con varios presupuestos. Revisar y consolidar manualmente sin perder historial antes de migrar.';
 END IF;
 IF (SELECT COUNT(*) FROM "Usuario" WHERE rol = 'ADMIN') > 1 THEN
  RAISE EXCEPTION 'Hay varios administradores. Definir el administrador único antes de migrar.';
 END IF;
END $$;
CREATE UNIQUE INDEX "Presupuesto_ordenTrabajoId_key" ON "Presupuesto"("ordenTrabajoId");
CREATE UNIQUE INDEX "Usuario_admin_unico" ON "Usuario"("rol") WHERE "rol" = 'ADMIN';
