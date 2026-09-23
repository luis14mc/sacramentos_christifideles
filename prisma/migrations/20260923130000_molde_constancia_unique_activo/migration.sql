-- ============================================================================
-- MoldeConstancia: garantizar máximo UN molde activo por
-- (id_parroquia, sacramento, tipo_constancia).
--
-- Prisma no soporta UNIQUE parcial nativo en schema.prisma, así que la
-- constraint se declara vía SQL y se documenta en el modelo. La unicidad
-- existente por (parroquia, sacramento, tipo, nombre) sigue aplicando para
-- el conjunto total (activos + inactivos).
--
-- También se cambia el default de activo a FALSE: el flujo correcto es
-- POST = borrador inactivo, PUT = mapear + activar.
-- ============================================================================

ALTER TABLE "molde_constancia"
  ALTER COLUMN "activo" SET DEFAULT false;

CREATE UNIQUE INDEX "molde_constancia_id_parroquia_sacramento_tipo_activo_key"
  ON "molde_constancia"("id_parroquia", "sacramento", "tipo_constancia")
  WHERE "activo" = true;
