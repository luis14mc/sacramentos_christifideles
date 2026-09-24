-- Filiación opcional para registros sacramentales.
-- La documentación civil puede contener solo madre, solo padre, ambos o ninguno.
ALTER TABLE "bautismo"
  ALTER COLUMN "numero_identidad_madre" DROP NOT NULL,
  ALTER COLUMN "numero_identidad_padre" DROP NOT NULL;

ALTER TABLE "primera_comunion"
  ALTER COLUMN "numero_identidad_madre" DROP NOT NULL,
  ALTER COLUMN "numero_identidad_padre" DROP NOT NULL;

ALTER TABLE "confirmacion"
  ALTER COLUMN "numero_identidad_madre" DROP NOT NULL,
  ALTER COLUMN "numero_identidad_padre" DROP NOT NULL;
