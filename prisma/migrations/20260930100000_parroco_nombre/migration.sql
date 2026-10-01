-- ============================================================================
-- parroquia_config: nombre del párroco que firma las constancias.
-- Funcionalmente editable desde /configuracion/parroquia. Se expone como
-- token {{parroquia.parroco}} en plantillas y moldes.
-- ============================================================================
ALTER TABLE "parroquia_config"
  ADD COLUMN "parroco_nombre" VARCHAR(150);