-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "instancia" (
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "url" VARCHAR(300) NOT NULL,
    "secreto_cifrado" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instancia_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "solicitud" (
    "uuid" UUID NOT NULL,
    "origen" VARCHAR(50) NOT NULL,
    "destino" VARCHAR(50) NOT NULL,
    "dni_hash" CHAR(64) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resuelta_at" TIMESTAMPTZ(6),

    CONSTRAINT "solicitud_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "solicitud_destino_estado_idx" ON "solicitud"("destino", "estado");

-- CreateIndex
CREATE INDEX "solicitud_origen_created_at_idx" ON "solicitud"("origen", "created_at");

-- AddForeignKey
ALTER TABLE "solicitud" ADD CONSTRAINT "solicitud_origen_fkey" FOREIGN KEY ("origen") REFERENCES "instancia"("codigo") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "solicitud" ADD CONSTRAINT "solicitud_destino_fkey" FOREIGN KEY ("destino") REFERENCES "instancia"("codigo") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- Reglas de dominio
ALTER TABLE "solicitud"
  ADD CONSTRAINT "solicitud_estado_chk"
    CHECK ("estado" IN ('pendiente', 'aprobada', 'rechazada', 'error_entrega')),
  ADD CONSTRAINT "solicitud_origen_destino_chk" CHECK ("origen" <> "destino");
