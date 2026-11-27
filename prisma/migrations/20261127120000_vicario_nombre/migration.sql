-- ============================================================================
-- parroquia_config: nombre del vicario parroquial (opcional).
-- Según las indicaciones de la Arquidiócesis de Tegucigalpa, las
-- certificaciones las firma el párroco o, en su defecto, el vicario
-- parroquial. Editable desde /configuracion/parroquia.
-- ============================================================================
ALTER TABLE "parroquia_config"
  ADD COLUMN "vicario_nombre" VARCHAR(150);
