-- ============================================================================
-- MoldeConstancia: PDF con AcroForm subible por parroquia para personalizar
-- la generación de constancias. El servidor lee los datos SIEMPRE desde la
-- base de datos; el cliente solo aporta sacramento, id y tipo_constancia.
--
-- Esta migración es aditiva: no altera tablas existentes y mantiene la
-- generación actual de constancias como fallback.
-- ============================================================================

-- CreateTable
CREATE TABLE "molde_constancia" (
    "id" BIGSERIAL NOT NULL,
    "id_parroquia" SMALLINT NOT NULL,
    "sacramento" TEXT NOT NULL,
    "tipo_constancia" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "archivo" BYTEA NOT NULL,
    "archivo_nombre" VARCHAR(255) NOT NULL,
    "archivo_mime" VARCHAR(50) NOT NULL DEFAULT 'application/pdf',
    "archivo_bytes" INTEGER NOT NULL,
    "mapa_campos" JSONB NOT NULL DEFAULT '{}',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "molde_constancia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "molde_constancia_id_parroquia_sacramento_tipo_constancia__key"
  ON "molde_constancia"("id_parroquia", "sacramento", "tipo_constancia", "nombre");

-- CreateIndex
CREATE INDEX "molde_constancia_id_parroquia_sacramento_tipo_constancia_a_idx"
  ON "molde_constancia"("id_parroquia", "sacramento", "tipo_constancia", "activo");

-- AddForeignKey
ALTER TABLE "molde_constancia"
  ADD CONSTRAINT "molde_constancia_id_parroquia_fkey"
  FOREIGN KEY ("id_parroquia") REFERENCES "parroquia"("id_parroquia")
  ON DELETE CASCADE ON UPDATE CASCADE;
