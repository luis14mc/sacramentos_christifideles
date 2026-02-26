-- Migración: Agregar campos de logo a parroquia_config
-- Fecha: 2026-01-06
-- Descripción: Agrega los campos logo_url y sello_digital_url a la tabla parroquia_config
--              si no existen. Esta migración es idempotente y puede ejecutarse múltiples veces.

-- Verificar si la tabla existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'parroquia_config') THEN
        -- Crear la tabla si no existe
        CREATE TABLE public.parroquia_config (
            id_parroquia SMALLINT NOT NULL PRIMARY KEY,
            alias_liturgico VARCHAR(150),
            logo_url TEXT,
            sello_digital_url TEXT,
            tz VARCHAR(255) DEFAULT 'America/Tegucigalpa',
            idioma CHAR(2) DEFAULT 'es',
            opciones JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ(6) DEFAULT NOW(),
            updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
            
            CONSTRAINT fk_parroquia_config_parroquia 
                FOREIGN KEY (id_parroquia) 
                REFERENCES public.parroquia(id_parroquia) 
                ON DELETE CASCADE
        );
        
        RAISE NOTICE 'Tabla parroquia_config creada';
    ELSE
        RAISE NOTICE 'Tabla parroquia_config ya existe';
    END IF;
END $$;

-- Agregar columna logo_url si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'parroquia_config' 
        AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE public.parroquia_config ADD COLUMN logo_url TEXT;
        RAISE NOTICE 'Columna logo_url agregada';
    ELSE
        RAISE NOTICE 'Columna logo_url ya existe';
    END IF;
END $$;

-- Agregar columna sello_digital_url si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'parroquia_config' 
        AND column_name = 'sello_digital_url'
    ) THEN
        ALTER TABLE public.parroquia_config ADD COLUMN sello_digital_url TEXT;
        RAISE NOTICE 'Columna sello_digital_url agregada';
    ELSE
        RAISE NOTICE 'Columna sello_digital_url ya existe';
    END IF;
END $$;

-- Verificar estructura final
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'parroquia_config'
ORDER BY ordinal_position;

-- Comentarios informativos
COMMENT ON TABLE public.parroquia_config IS 'Configuración específica de cada parroquia incluyendo logos y personalizaciones';
COMMENT ON COLUMN public.parroquia_config.logo_url IS 'URL del logo de la parroquia para usar en navbar y documentos';
COMMENT ON COLUMN public.parroquia_config.sello_digital_url IS 'URL del sello digital de la parroquia para documentos oficiales';
COMMENT ON COLUMN public.parroquia_config.alias_liturgico IS 'Nombre litúrgico completo para documentos oficiales';
COMMENT ON COLUMN public.parroquia_config.opciones IS 'Configuraciones adicionales en formato JSON (pie_constancia, etc)';

-- Migración completada
SELECT 'Migración completada exitosamente' AS status;
