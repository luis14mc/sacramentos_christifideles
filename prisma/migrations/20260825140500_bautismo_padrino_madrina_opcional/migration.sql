-- ============================================================================
-- Bautismo: padrino y madrina pasan a ser OPCIONALES.
-- Regla funcional v1: se exige al menos UNO entre padrino y madrina.
-- Esta migración NO toca confirmacion ni matrimonio.
-- ============================================================================

ALTER TABLE "bautismo"
  ALTER COLUMN "numero_identidad_madrina" DROP NOT NULL,
  ALTER COLUMN "numero_identidad_padrino" DROP NOT NULL;

-- Restricción CHECK para garantizar la regla de dominio a nivel de BD
-- (defensa adicional más allá de la validación de la capa de aplicación).
ALTER TABLE "bautismo"
  ADD CONSTRAINT "bautismo_padrino_o_madrina_chk"
  CHECK (
    "numero_identidad_madrina" IS NOT NULL
    OR "numero_identidad_padrino" IS NOT NULL
  );