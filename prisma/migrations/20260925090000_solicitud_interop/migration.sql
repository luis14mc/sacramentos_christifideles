-- Consultas entre parroquias vía hub (solo lectura).
-- Ver docs/PLAN_MULTIPARROQUIA.md, Fase 4.

-- CreateTable
CREATE TABLE "solicitud_interop" (
    "id_solicitud" BIGSERIAL NOT NULL,
    "id_parroquia" SMALLINT NOT NULL,
    "uuid" UUID,
    "direccion" CHAR(1) NOT NULL,
    "codigo_parroquia_contraparte" VARCHAR(50) NOT NULL,
    "nombre_parroquia_contraparte" VARCHAR(100),
    "numero_identidad_consultado" VARCHAR(20) NOT NULL,
    "motivo" VARCHAR(500) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "id_usuario_solicitante" BIGINT,
    "id_usuario_resolutor" BIGINT,
    "motivo_rechazo" VARCHAR(500),
    "respuesta" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resuelta_at" TIMESTAMPTZ(6),

    CONSTRAINT "solicitud_interop_pkey" PRIMARY KEY ("id_solicitud")
);

-- CreateIndex
CREATE UNIQUE INDEX "solicitud_interop_uuid_key" ON "solicitud_interop"("uuid");

-- CreateIndex
CREATE INDEX "solicitud_interop_id_parroquia_direccion_estado_created_at_idx" ON "solicitud_interop"("id_parroquia", "direccion", "estado", "created_at");

-- AddForeignKey
ALTER TABLE "solicitud_interop" ADD CONSTRAINT "solicitud_interop_id_parroquia_fkey" FOREIGN KEY ("id_parroquia") REFERENCES "parroquia"("id_parroquia") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- Reglas de dominio (espejo de docs/christi_fidelis_bdd_pg_v3.sql)
ALTER TABLE "solicitud_interop"
  ADD CONSTRAINT "solicitud_interop_direccion_chk" CHECK ("direccion" IN ('S', 'E')),
  ADD CONSTRAINT "solicitud_interop_estado_chk"
    CHECK ("estado" IN ('pendiente', 'aprobada', 'rechazada', 'error_envio'));
