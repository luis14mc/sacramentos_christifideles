-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateTable
CREATE TABLE "departamento" (
    "codigo_departamento" CHAR(2) NOT NULL,
    "nombre_departamento" VARCHAR(55) NOT NULL,

    CONSTRAINT "departamento_pkey" PRIMARY KEY ("codigo_departamento")
);

-- CreateTable
CREATE TABLE "municipio" (
    "codigo_municipio" CHAR(4) NOT NULL,
    "codigo_departamento" CHAR(2) NOT NULL,
    "nombre_municipio" VARCHAR(55) NOT NULL,

    CONSTRAINT "municipio_pkey" PRIMARY KEY ("codigo_municipio")
);

-- CreateTable
CREATE TABLE "parroquia" (
    "id_parroquia" SMALLSERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "ubicacion" CHAR(4) NOT NULL,
    "direccion" VARCHAR(1000) NOT NULL,
    "telefono" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255),

    CONSTRAINT "parroquia_pkey" PRIMARY KEY ("id_parroquia")
);

-- CreateTable
CREATE TABLE "parroquia_config" (
    "id_parroquia" SMALLINT NOT NULL,
    "alias_liturgico" VARCHAR(150),
    "logo_url" TEXT,
    "sello_digital_url" TEXT,
    "tz" TEXT DEFAULT 'America/Tegucigalpa',
    "idioma" CHAR(2) DEFAULT 'es',
    "opciones" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parroquia_config_pkey" PRIMARY KEY ("id_parroquia")
);

-- CreateTable
CREATE TABLE "plantilla_constancia" (
    "id" BIGSERIAL NOT NULL,
    "id_parroquia" SMALLINT NOT NULL,
    "sacramento" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "contenido" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plantilla_constancia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parroquia_parametro" (
    "id" BIGSERIAL NOT NULL,
    "id_parroquia" SMALLINT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "parroquia_parametro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "numeradores" (
    "id" BIGSERIAL NOT NULL,
    "id_parroquia" SMALLINT NOT NULL,
    "modulo" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'general',
    "ultimo_libro" INTEGER DEFAULT 0,
    "ultimo_folio" INTEGER DEFAULT 0,
    "ultimo_acta" INTEGER DEFAULT 0,
    "ultimo_registro" INTEGER DEFAULT 0,

    CONSTRAINT "numeradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_usuario" (
    "id_rol" SMALLSERIAL NOT NULL,
    "nombre" VARCHAR(55) NOT NULL,
    "descripcion" VARCHAR(500),
    "estado" SMALLINT NOT NULL DEFAULT 1,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_creacion" BIGINT NOT NULL,

    CONSTRAINT "rol_usuario_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "pagina" (
    "id_pagina" SMALLSERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(1000),
    "url" TEXT NOT NULL,
    "estado" SMALLINT NOT NULL DEFAULT 1,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_creacion" BIGINT NOT NULL,

    CONSTRAINT "pagina_pkey" PRIMARY KEY ("id_pagina")
);

-- CreateTable
CREATE TABLE "tr_rol_pagina" (
    "id_rol" SMALLINT NOT NULL,
    "id_pagina" SMALLINT NOT NULL,
    "puede_ver" SMALLINT NOT NULL DEFAULT 1,
    "puede_crear" SMALLINT NOT NULL DEFAULT 0,
    "puede_actualizar" SMALLINT NOT NULL DEFAULT 0,
    "puede_borrar" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "tr_rol_pagina_pkey" PRIMARY KEY ("id_rol","id_pagina")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" BIGSERIAL NOT NULL,
    "id_parroquia" SMALLINT NOT NULL,
    "id_rol" SMALLINT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "email" CITEXT NOT NULL,
    "contrasena" BYTEA NOT NULL,
    "telefono" VARCHAR(100),
    "estado" SMALLINT NOT NULL DEFAULT 1,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_creacion" BIGINT NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "orden_religiosa" (
    "id_orden_religiosa" SMALLSERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "nombre_latin" VARCHAR(100),
    "abreviatura" VARCHAR(15),
    "descripcion" VARCHAR(1000),
    "rama" CHAR(1) NOT NULL,

    CONSTRAINT "orden_religiosa_pkey" PRIMARY KEY ("id_orden_religiosa")
);

-- CreateTable
CREATE TABLE "rango_orden_sacerdotal" (
    "id_rango_sacerdotal" SMALLSERIAL NOT NULL,
    "nombre" VARCHAR(55) NOT NULL,
    "descripcion" VARCHAR(200),

    CONSTRAINT "rango_orden_sacerdotal_pkey" PRIMARY KEY ("id_rango_sacerdotal")
);

-- CreateTable
CREATE TABLE "orden_sacerdotal" (
    "id_parroquia" SMALLINT NOT NULL,
    "numero_identidad" VARCHAR(20) NOT NULL,
    "id_rango_sacerdotal" SMALLINT NOT NULL,
    "id_orden_religiosa" SMALLINT NOT NULL,
    "es_parroco" SMALLINT NOT NULL DEFAULT 0,
    "estado_ministerial" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "orden_sacerdotal_pkey" PRIMARY KEY ("id_parroquia","numero_identidad")
);

-- CreateTable
CREATE TABLE "tipo_sector_parroquial" (
    "id_tipo_sector_parroquial" SMALLSERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(1000),

    CONSTRAINT "tipo_sector_parroquial_pkey" PRIMARY KEY ("id_tipo_sector_parroquial")
);

-- CreateTable
CREATE TABLE "sector_parroquial" (
    "id_sector_parroquial" BIGSERIAL NOT NULL,
    "id_parroquia" SMALLINT NOT NULL,
    "id_tipo_sector_parroquial" SMALLINT NOT NULL,
    "nombre" VARCHAR(55) NOT NULL,
    "nombre_capilla" VARCHAR(55),
    "direccion" VARCHAR(1000) NOT NULL,

    CONSTRAINT "sector_parroquial_pkey" PRIMARY KEY ("id_sector_parroquial")
);

-- CreateTable
CREATE TABLE "persona" (
    "numero_identidad" VARCHAR(20) NOT NULL,
    "id_parroquia" SMALLINT NOT NULL,
    "id_sector_parroquial" BIGINT NOT NULL,
    "id_orden_religiosa" SMALLINT NOT NULL,
    "nombres" VARCHAR(55) NOT NULL,
    "apellidos" VARCHAR(55) NOT NULL,
    "fecha_nacimiento" DATE NOT NULL,
    "lugar_nacimiento" CHAR(4) NOT NULL,
    "sexo" CHAR(1) NOT NULL,
    "telefono" VARCHAR(100) NOT NULL,
    "email" CITEXT,
    "direccion" VARCHAR(1000),
    "estado_vital" SMALLINT NOT NULL DEFAULT 1,
    "estado_activo_parroquia" SMALLINT NOT NULL,
    "otra_orden_religiosa" VARCHAR(255),
    "imagen" VARCHAR(300),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "persona_pkey" PRIMARY KEY ("id_parroquia","numero_identidad")
);

-- CreateTable
CREATE TABLE "grupo_parroquial" (
    "id_grupo_parroquial" SMALLSERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" VARCHAR(2500),

    CONSTRAINT "grupo_parroquial_pkey" PRIMARY KEY ("id_grupo_parroquial")
);

-- CreateTable
CREATE TABLE "rol_parroquial" (
    "id_rol_parroquial" SMALLSERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" VARCHAR(2500),

    CONSTRAINT "rol_parroquial_pkey" PRIMARY KEY ("id_rol_parroquial")
);

-- CreateTable
CREATE TABLE "tr_persona_grupo_rol" (
    "numero_identidad" VARCHAR(20) NOT NULL,
    "id_parroquia" SMALLINT NOT NULL,
    "id_grupo_parroquial" SMALLINT NOT NULL,
    "id_rol_parroquial" SMALLINT NOT NULL,

    CONSTRAINT "tr_persona_grupo_rol_pkey" PRIMARY KEY ("id_parroquia","numero_identidad","id_grupo_parroquial","id_rol_parroquial")
);

-- CreateTable
-- NOTA: padrino/madrina son NOT NULL en el baseline. La relajación a opcional
-- se aplica en una migración posterior (bautismo_padrino_madrina_opcional).
CREATE TABLE "bautismo" (
    "id_bautismo" BIGSERIAL NOT NULL,
    "id_parroquia" SMALLINT NOT NULL,
    "numero_identidad_bautizado" VARCHAR(20) NOT NULL,
    "numero_identidad_madre" VARCHAR(20) NOT NULL,
    "numero_identidad_padre" VARCHAR(20) NOT NULL,
    "numero_identidad_madrina" VARCHAR(20) NOT NULL,
    "numero_identidad_padrino" VARCHAR(20) NOT NULL,
    "numero_identidad_catequista" VARCHAR(20) NOT NULL,
    "numero_identidad_sacerdote" VARCHAR(20) NOT NULL,
    "fecha_bautismo" TIMESTAMPTZ(6) NOT NULL,
    "numero_folio" TEXT NOT NULL,
    "numero_libro" TEXT NOT NULL,
    "numero_pagina" TEXT NOT NULL,
    "numero_registro" TEXT NOT NULL,
    "nota_marginal" VARCHAR(1000),

    CONSTRAINT "bautismo_pkey" PRIMARY KEY ("id_bautismo")
);

-- CreateTable
CREATE TABLE "primera_comunion" (
    "id_primera_comunion" BIGSERIAL NOT NULL,
    "id_parroquia" SMALLINT NOT NULL,
    "numero_identidad_persona" VARCHAR(20) NOT NULL,
    "numero_identidad_madre" VARCHAR(20) NOT NULL,
    "numero_identidad_padre" VARCHAR(20) NOT NULL,
    "numero_identidad_catequista" VARCHAR(20) NOT NULL,
    "numero_identidad_sacerdote" VARCHAR(20) NOT NULL,
    "fecha_primera_comunion" TIMESTAMPTZ(6) NOT NULL,
    "numero_acta" TEXT NOT NULL,
    "numero_libro" TEXT NOT NULL,
    "numero_pagina" TEXT NOT NULL,
    "numero_registro" TEXT NOT NULL,
    "nota_marginal" VARCHAR(1000),

    CONSTRAINT "primera_comunion_pkey" PRIMARY KEY ("id_primera_comunion")
);

-- CreateTable
CREATE TABLE "confirmacion" (
    "id_confirmacion" BIGSERIAL NOT NULL,
    "id_parroquia" SMALLINT NOT NULL,
    "numero_identidad_confirmado" VARCHAR(20) NOT NULL,
    "numero_identidad_madre" VARCHAR(20) NOT NULL,
    "numero_identidad_padre" VARCHAR(20) NOT NULL,
    "numero_identidad_madrina" VARCHAR(20) NOT NULL,
    "numero_identidad_padrino" VARCHAR(20) NOT NULL,
    "numero_identidad_catequista" VARCHAR(20) NOT NULL,
    "numero_identidad_obispo" VARCHAR(20) NOT NULL,
    "fecha_confirmacion" TIMESTAMPTZ(6) NOT NULL,
    "numero_acta" TEXT NOT NULL,
    "numero_libro" TEXT NOT NULL,
    "numero_pagina" TEXT,
    "numero_registro" TEXT NOT NULL,
    "nota_marginal" VARCHAR(1000),

    CONSTRAINT "confirmacion_pkey" PRIMARY KEY ("id_confirmacion")
);

-- CreateTable
CREATE TABLE "matrimonio" (
    "id_matrimonio" BIGSERIAL NOT NULL,
    "id_parroquia" SMALLINT NOT NULL,
    "numero_identidad_esposa" VARCHAR(20) NOT NULL,
    "numero_identidad_esposo" VARCHAR(20) NOT NULL,
    "numero_identidad_madrina" VARCHAR(20) NOT NULL,
    "numero_identidad_padrino" VARCHAR(20) NOT NULL,
    "numero_identidad_sacerdote" VARCHAR(20) NOT NULL,
    "numero_identidad_madre_esposa" VARCHAR(20),
    "numero_identidad_padre_esposa" VARCHAR(20),
    "numero_identidad_madre_esposo" VARCHAR(20),
    "numero_identidad_padre_esposo" VARCHAR(20),
    "fecha_matrimonio" TIMESTAMPTZ(6) NOT NULL,
    "numero_acta" TEXT NOT NULL,
    "numero_libro" TEXT NOT NULL,
    "numero_pagina" TEXT,
    "numero_registro" TEXT NOT NULL,
    "nota_marginal" VARCHAR(1000),

    CONSTRAINT "matrimonio_pkey" PRIMARY KEY ("id_matrimonio")
);

-- CreateTable
CREATE TABLE "bitacora_crud" (
    "id_accion" BIGSERIAL NOT NULL,
    "id_parroquia" SMALLINT NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "accion" CHAR(1) NOT NULL,
    "id_tabla_afectado" BIGINT,
    "nombre_tabla" VARCHAR(100) NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "old_values" JSONB,
    "new_values" JSONB,
    "actor_ip" INET,
    "user_agent" TEXT,

    CONSTRAINT "bitacora_crud_pkey" PRIMARY KEY ("id_accion")
);

-- CreateTable
CREATE TABLE "bitacora_login" (
    "id_ingreso" BIGSERIAL NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "fecha_ingreso" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_ip" INET,
    "user_agent" TEXT,

    CONSTRAINT "bitacora_login_pkey" PRIMARY KEY ("id_ingreso")
);

-- CreateTable
CREATE TABLE "bitacora_persona_parroquia" (
    "id_registro" BIGSERIAL NOT NULL,
    "numero_identidad" VARCHAR(20) NOT NULL,
    "id_parroquia" SMALLINT NOT NULL,
    "es_parroco" SMALLINT NOT NULL DEFAULT 0,
    "fecha_ingreso" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_salida" TIMESTAMPTZ(6),

    CONSTRAINT "bitacora_persona_parroquia_pkey" PRIMARY KEY ("id_registro")
);

-- CreateIndex
CREATE UNIQUE INDEX "plantilla_constancia_id_parroquia_sacramento_nombre_key" ON "plantilla_constancia"("id_parroquia", "sacramento", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "parroquia_parametro_id_parroquia_clave_key" ON "parroquia_parametro"("id_parroquia", "clave");

-- CreateIndex
CREATE UNIQUE INDEX "numeradores_id_parroquia_modulo_scope_key" ON "numeradores"("id_parroquia", "modulo", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "persona_id_parroquia_apellidos_idx" ON "persona"("id_parroquia", "apellidos");

-- CreateIndex
CREATE INDEX "persona_numero_identidad_idx" ON "persona"("numero_identidad");

-- CreateIndex
CREATE INDEX "bautismo_id_parroquia_fecha_bautismo_idx" ON "bautismo"("id_parroquia", "fecha_bautismo");

-- CreateIndex
CREATE UNIQUE INDEX "bautismo_id_parroquia_numero_libro_numero_pagina_numero_reg_key" ON "bautismo"("id_parroquia", "numero_libro", "numero_pagina", "numero_registro");

-- CreateIndex
CREATE INDEX "primera_comunion_id_parroquia_fecha_primera_comunion_idx" ON "primera_comunion"("id_parroquia", "fecha_primera_comunion");

-- CreateIndex
CREATE UNIQUE INDEX "primera_comunion_id_parroquia_numero_libro_numero_pagina_nu_key" ON "primera_comunion"("id_parroquia", "numero_libro", "numero_pagina", "numero_registro");

-- CreateIndex
CREATE INDEX "confirmacion_id_parroquia_fecha_confirmacion_idx" ON "confirmacion"("id_parroquia", "fecha_confirmacion");

-- CreateIndex
CREATE UNIQUE INDEX "confirmacion_id_parroquia_numero_libro_numero_pagina_numero_key" ON "confirmacion"("id_parroquia", "numero_libro", "numero_pagina", "numero_registro");

-- CreateIndex
CREATE INDEX "matrimonio_id_parroquia_fecha_matrimonio_idx" ON "matrimonio"("id_parroquia", "fecha_matrimonio");

-- CreateIndex
CREATE UNIQUE INDEX "matrimonio_id_parroquia_numero_libro_numero_pagina_numero_r_key" ON "matrimonio"("id_parroquia", "numero_libro", "numero_pagina", "numero_registro");

-- CreateIndex
CREATE INDEX "bitacora_crud_id_parroquia_nombre_tabla_fecha_idx" ON "bitacora_crud"("id_parroquia", "nombre_tabla", "fecha");

-- AddForeignKey
ALTER TABLE "municipio" ADD CONSTRAINT "municipio_codigo_departamento_fkey" FOREIGN KEY ("codigo_departamento") REFERENCES "departamento"("codigo_departamento") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "parroquia" ADD CONSTRAINT "fk_parroquia_muni" FOREIGN KEY ("ubicacion") REFERENCES "municipio"("codigo_municipio") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "parroquia_config" ADD CONSTRAINT "parroquia_config_id_parroquia_fkey" FOREIGN KEY ("id_parroquia") REFERENCES "parroquia"("id_parroquia") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantilla_constancia" ADD CONSTRAINT "plantilla_constancia_id_parroquia_fkey" FOREIGN KEY ("id_parroquia") REFERENCES "parroquia"("id_parroquia") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parroquia_parametro" ADD CONSTRAINT "parroquia_parametro_id_parroquia_fkey" FOREIGN KEY ("id_parroquia") REFERENCES "parroquia"("id_parroquia") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "numeradores" ADD CONSTRAINT "numeradores_id_parroquia_fkey" FOREIGN KEY ("id_parroquia") REFERENCES "parroquia"("id_parroquia") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tr_rol_pagina" ADD CONSTRAINT "tr_rol_pagina_id_pagina_fkey" FOREIGN KEY ("id_pagina") REFERENCES "pagina"("id_pagina") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "tr_rol_pagina" ADD CONSTRAINT "tr_rol_pagina_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "rol_usuario"("id_rol") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_parroquia_fkey" FOREIGN KEY ("id_parroquia") REFERENCES "parroquia"("id_parroquia") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "rol_usuario"("id_rol") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "orden_sacerdotal" ADD CONSTRAINT "orden_sacerdotal_id_parroquia_numero_identidad_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "orden_sacerdotal" ADD CONSTRAINT "orden_sacerdotal_id_orden_religiosa_fkey" FOREIGN KEY ("id_orden_religiosa") REFERENCES "orden_religiosa"("id_orden_religiosa") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "orden_sacerdotal" ADD CONSTRAINT "orden_sacerdotal_id_parroquia_fkey" FOREIGN KEY ("id_parroquia") REFERENCES "parroquia"("id_parroquia") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "orden_sacerdotal" ADD CONSTRAINT "orden_sacerdotal_id_rango_sacerdotal_fkey" FOREIGN KEY ("id_rango_sacerdotal") REFERENCES "rango_orden_sacerdotal"("id_rango_sacerdotal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sector_parroquial" ADD CONSTRAINT "sector_parroquial_id_parroquia_fkey" FOREIGN KEY ("id_parroquia") REFERENCES "parroquia"("id_parroquia") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "sector_parroquial" ADD CONSTRAINT "sector_parroquial_id_tipo_sector_parroquial_fkey" FOREIGN KEY ("id_tipo_sector_parroquial") REFERENCES "tipo_sector_parroquial"("id_tipo_sector_parroquial") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "persona" ADD CONSTRAINT "persona_id_orden_religiosa_fkey" FOREIGN KEY ("id_orden_religiosa") REFERENCES "orden_religiosa"("id_orden_religiosa") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "persona" ADD CONSTRAINT "persona_id_parroquia_fkey" FOREIGN KEY ("id_parroquia") REFERENCES "parroquia"("id_parroquia") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "persona" ADD CONSTRAINT "persona_id_sector_parroquial_fkey" FOREIGN KEY ("id_sector_parroquial") REFERENCES "sector_parroquial"("id_sector_parroquial") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "persona" ADD CONSTRAINT "persona_lugar_nacimiento_fkey" FOREIGN KEY ("lugar_nacimiento") REFERENCES "municipio"("codigo_municipio") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "tr_persona_grupo_rol" ADD CONSTRAINT "tr_persona_grupo_rol_id_grupo_parroquial_fkey" FOREIGN KEY ("id_grupo_parroquial") REFERENCES "grupo_parroquial"("id_grupo_parroquial") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "tr_persona_grupo_rol" ADD CONSTRAINT "tr_persona_grupo_rol_id_parroquia_numero_identidad_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "tr_persona_grupo_rol" ADD CONSTRAINT "tr_persona_grupo_rol_id_rol_parroquial_fkey" FOREIGN KEY ("id_rol_parroquial") REFERENCES "rol_parroquial"("id_rol_parroquial") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "bautismo" ADD CONSTRAINT "bautismo_id_parroquia_fkey" FOREIGN KEY ("id_parroquia") REFERENCES "parroquia"("id_parroquia") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "bautismo" ADD CONSTRAINT "bautismo_id_parroquia_numero_identidad_bautizado_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_bautizado") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bautismo" ADD CONSTRAINT "bautismo_id_parroquia_numero_identidad_catequista_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_catequista") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bautismo" ADD CONSTRAINT "bautismo_id_parroquia_numero_identidad_madre_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_madre") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bautismo" ADD CONSTRAINT "bautismo_id_parroquia_numero_identidad_madrina_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_madrina") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bautismo" ADD CONSTRAINT "bautismo_id_parroquia_numero_identidad_padre_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_padre") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bautismo" ADD CONSTRAINT "bautismo_id_parroquia_numero_identidad_padrino_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_padrino") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bautismo" ADD CONSTRAINT "bautismo_id_parroquia_numero_identidad_sacerdote_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_sacerdote") REFERENCES "orden_sacerdotal"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primera_comunion" ADD CONSTRAINT "primera_comunion_id_parroquia_fkey" FOREIGN KEY ("id_parroquia") REFERENCES "parroquia"("id_parroquia") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "primera_comunion" ADD CONSTRAINT "primera_comunion_id_parroquia_numero_identidad_catequista_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_catequista") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primera_comunion" ADD CONSTRAINT "primera_comunion_id_parroquia_numero_identidad_madre_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_madre") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primera_comunion" ADD CONSTRAINT "primera_comunion_id_parroquia_numero_identidad_padre_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_padre") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primera_comunion" ADD CONSTRAINT "primera_comunion_id_parroquia_numero_identidad_persona_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_persona") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primera_comunion" ADD CONSTRAINT "primera_comunion_id_parroquia_numero_identidad_sacerdote_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_sacerdote") REFERENCES "orden_sacerdotal"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmacion" ADD CONSTRAINT "confirmacion_id_parroquia_fkey" FOREIGN KEY ("id_parroquia") REFERENCES "parroquia"("id_parroquia") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "confirmacion" ADD CONSTRAINT "confirmacion_id_parroquia_numero_identidad_catequista_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_catequista") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmacion" ADD CONSTRAINT "confirmacion_id_parroquia_numero_identidad_confirmado_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_confirmado") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmacion" ADD CONSTRAINT "confirmacion_id_parroquia_numero_identidad_madre_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_madre") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmacion" ADD CONSTRAINT "confirmacion_id_parroquia_numero_identidad_madrina_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_madrina") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmacion" ADD CONSTRAINT "confirmacion_id_parroquia_numero_identidad_padre_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_padre") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmacion" ADD CONSTRAINT "confirmacion_id_parroquia_numero_identidad_padrino_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_padrino") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmacion" ADD CONSTRAINT "confirmacion_id_parroquia_numero_identidad_obispo_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_obispo") REFERENCES "orden_sacerdotal"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrimonio" ADD CONSTRAINT "matrimonio_id_parroquia_fkey" FOREIGN KEY ("id_parroquia") REFERENCES "parroquia"("id_parroquia") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "matrimonio" ADD CONSTRAINT "matrimonio_id_parroquia_numero_identidad_esposa_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_esposa") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrimonio" ADD CONSTRAINT "matrimonio_id_parroquia_numero_identidad_esposo_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_esposo") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrimonio" ADD CONSTRAINT "matrimonio_id_parroquia_numero_identidad_madre_esposa_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_madre_esposa") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrimonio" ADD CONSTRAINT "matrimonio_id_parroquia_numero_identidad_madre_esposo_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_madre_esposo") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrimonio" ADD CONSTRAINT "matrimonio_id_parroquia_numero_identidad_madrina_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_madrina") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrimonio" ADD CONSTRAINT "matrimonio_id_parroquia_numero_identidad_padre_esposa_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_padre_esposa") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrimonio" ADD CONSTRAINT "matrimonio_id_parroquia_numero_identidad_padre_esposo_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_padre_esposo") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrimonio" ADD CONSTRAINT "matrimonio_id_parroquia_numero_identidad_padrino_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_padrino") REFERENCES "persona"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrimonio" ADD CONSTRAINT "matrimonio_id_parroquia_numero_identidad_sacerdote_fkey" FOREIGN KEY ("id_parroquia", "numero_identidad_sacerdote") REFERENCES "orden_sacerdotal"("id_parroquia", "numero_identidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora_crud" ADD CONSTRAINT "bitacora_crud_id_parroquia_fkey" FOREIGN KEY ("id_parroquia") REFERENCES "parroquia"("id_parroquia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora_login" ADD CONSTRAINT "bitacora_login_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora_persona_parroquia" ADD CONSTRAINT "bitacora_persona_parroquia_id_parroquia_fkey" FOREIGN KEY ("id_parroquia") REFERENCES "parroquia"("id_parroquia") ON DELETE RESTRICT ON UPDATE CASCADE;
