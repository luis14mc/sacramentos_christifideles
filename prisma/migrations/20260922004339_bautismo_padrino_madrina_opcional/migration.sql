-- ============================================================================
-- Bautismo: padrino y madrina pasan a ser OPCIONALES (delta sobre baseline).
--
-- Regla funcional v1 (alineada con docs/christi_fidelis_bdd_pg_v3.sql):
--   - al menos UNO entre padrino y madrina debe estar presente
--   - strings vacíos o solo espacios NO cuentan como padrino/madrina
--     (defensa adicional más allá de la validación de la capa de aplicación).
--
-- Esta migración es aditiva sobre el baseline (init): relaja NOT NULL y añade
-- el CHECK. No toca confirmacion ni matrimonio (allí padrino/madrina siguen
-- siendo NOT NULL en el baseline).
-- ============================================================================

ALTER TABLE "bautismo"
  ALTER COLUMN "numero_identidad_madrina" DROP NOT NULL,
  ALTER COLUMN "numero_identidad_padrino" DROP NOT NULL;

-- Restricción CHECK: garantiza "al menos uno" usando NULLIF + BTRIM para
-- tratar correctamente strings vacíos o con espacios, alineado con la
-- fuente de verdad (docs/christi_fidelis_bdd_pg_v3.sql).
ALTER TABLE "bautismo"
  ADD CONSTRAINT "bautismo_padrino_o_madrina_chk"
  CHECK (
    NULLIF(BTRIM("numero_identidad_madrina"), '') IS NOT NULL
    OR
    NULLIF(BTRIM("numero_identidad_padrino"), '') IS NOT NULL
  );
