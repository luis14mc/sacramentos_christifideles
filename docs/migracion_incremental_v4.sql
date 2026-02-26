-- ================================================================================
-- MIGRACIÓN INCREMENTAL PARA CHRISTI FIDELES
-- Agrega campos nuevos sin afectar estructura existente
-- Fecha: 5 de octubre de 2025
-- ================================================================================

-- Agregar campos de conectividad federada a la tabla parroquia (si no existen)
DO $$ 
BEGIN
    -- Código parroquial único
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia' AND column_name = 'codigo_parroquia') THEN
        ALTER TABLE parroquia ADD COLUMN codigo_parroquia VARCHAR(20) UNIQUE;
    END IF;
    
    -- Diócesis
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia' AND column_name = 'diocesis') THEN
        ALTER TABLE parroquia ADD COLUMN diocesis VARCHAR(100);
    END IF;
    
    -- Zona pastoral
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia' AND column_name = 'zona_pastoral') THEN
        ALTER TABLE parroquia ADD COLUMN zona_pastoral VARCHAR(50);
    END IF;
    
    -- Código diocesano
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia' AND column_name = 'codigo_diocesano') THEN
        ALTER TABLE parroquia ADD COLUMN codigo_diocesano VARCHAR(20);
    END IF;
    
    -- Conectividad federada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia' AND column_name = 'permite_consultas_externas') THEN
        ALTER TABLE parroquia ADD COLUMN permite_consultas_externas BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia' AND column_name = 'parroquias_autorizadas') THEN
        ALTER TABLE parroquia ADD COLUMN parroquias_autorizadas JSONB DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia' AND column_name = 'endpoint_notificaciones') THEN
        ALTER TABLE parroquia ADD COLUMN endpoint_notificaciones TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia' AND column_name = 'api_key_publica') THEN
        ALTER TABLE parroquia ADD COLUMN api_key_publica VARCHAR(200);
    END IF;
    
    -- Metadatos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia' AND column_name = 'fecha_fundacion') THEN
        ALTER TABLE parroquia ADD COLUMN fecha_fundacion DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia' AND column_name = 'fecha_registro_sistema') THEN
        ALTER TABLE parroquia ADD COLUMN fecha_registro_sistema TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Estado (si no existe como 'estado')
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia' AND column_name = 'estado') THEN
        ALTER TABLE parroquia ADD COLUMN estado SMALLINT DEFAULT 1;
    END IF;
END $$;

-- ================================================================================
-- EXTENSIÓN DE PARROQUIA_CONFIG
-- ================================================================================

DO $$
BEGIN
    -- Información del párroco para constancias
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'parroco_actual') THEN
        ALTER TABLE parroquia_config ADD COLUMN parroco_actual VARCHAR(200);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'parroco_desde') THEN
        ALTER TABLE parroquia_config ADD COLUMN parroco_desde DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'vicario_parroquial') THEN
        ALTER TABLE parroquia_config ADD COLUMN vicario_parroquial VARCHAR(200);
    END IF;
    
    -- Patronos de la parroquia
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'patron_principal') THEN
        ALTER TABLE parroquia_config ADD COLUMN patron_principal VARCHAR(150);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'fecha_patron_principal') THEN
        ALTER TABLE parroquia_config ADD COLUMN fecha_patron_principal DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'patron_secundario') THEN
        ALTER TABLE parroquia_config ADD COLUMN patron_secundario VARCHAR(150);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'fecha_patron_secundario') THEN
        ALTER TABLE parroquia_config ADD COLUMN fecha_patron_secundario DATE;
    END IF;
    
    -- Assets adicionales para documentos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'firma_parroco_url') THEN
        ALTER TABLE parroquia_config ADD COLUMN firma_parroco_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'membrete_url') THEN
        ALTER TABLE parroquia_config ADD COLUMN membrete_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'escudo_diocesano_url') THEN
        ALTER TABLE parroquia_config ADD COLUMN escudo_diocesano_url TEXT;
    END IF;
    
    -- Configuración de constancias
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'pie_constancia') THEN
        ALTER TABLE parroquia_config ADD COLUMN pie_constancia TEXT DEFAULT 'Dada en la Parroquia, a solicitud del interesado.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'encabezado_constancia') THEN
        ALTER TABLE parroquia_config ADD COLUMN encabezado_constancia TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'formato_numeracion_constancias') THEN
        ALTER TABLE parroquia_config ADD COLUMN formato_numeracion_constancias VARCHAR(50) DEFAULT '{tipo}-{año}-{numero}';
    END IF;
    
    -- Horarios ampliados
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'horarios_confesiones') THEN
        ALTER TABLE parroquia_config ADD COLUMN horarios_confesiones JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'horarios_atencion_oficina') THEN
        ALTER TABLE parroquia_config ADD COLUMN horarios_atencion_oficina JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'servicios_disponibles') THEN
        ALTER TABLE parroquia_config ADD COLUMN servicios_disponibles JSONB DEFAULT '[]';
    END IF;
    
    -- Configuración de identidad parroquial (sin afectar tema del sistema)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'nombre_corto') THEN
        ALTER TABLE parroquia_config ADD COLUMN nombre_corto VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'descripcion_parroquia') THEN
        ALTER TABLE parroquia_config ADD COLUMN descripcion_parroquia TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'frase_distintiva') THEN
        ALTER TABLE parroquia_config ADD COLUMN frase_distintiva VARCHAR(200);
    END IF;
    
    -- Configuración específica de logo parroquial
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'logo_parroquial_url') THEN
        ALTER TABLE parroquia_config ADD COLUMN logo_parroquial_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'mostrar_logo_parroquial') THEN
        ALTER TABLE parroquia_config ADD COLUMN mostrar_logo_parroquial JSONB DEFAULT '{
            "en_constancias": true,
            "en_reportes": true,
            "en_dashboard": true,
            "en_header": false,
            "posicion_dashboard": "sidebar_top",
            "tamaño_dashboard": "small"
        }';
    END IF;
    
    -- Configuración regional extendida
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'formato_fecha') THEN
        ALTER TABLE parroquia_config ADD COLUMN formato_fecha VARCHAR(20) DEFAULT 'DD/MM/YYYY';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'formato_hora') THEN
        ALTER TABLE parroquia_config ADD COLUMN formato_hora VARCHAR(20) DEFAULT 'HH:mm';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'moneda') THEN
        ALTER TABLE parroquia_config ADD COLUMN moneda CHAR(3) DEFAULT 'HNL';
    END IF;
    
    -- Configuración de documentos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'formato_papel') THEN
        ALTER TABLE parroquia_config ADD COLUMN formato_papel VARCHAR(10) DEFAULT 'letter';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'orientacion_papel') THEN
        ALTER TABLE parroquia_config ADD COLUMN orientacion_papel VARCHAR(10) DEFAULT 'portrait';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'margenes_documento') THEN
        ALTER TABLE parroquia_config ADD COLUMN margenes_documento JSONB DEFAULT '{"top": 2.5, "right": 2.5, "bottom": 2.5, "left": 2.5}';
    END IF;
    
    -- Configuración de numeración mejorada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'numeracion_config') THEN
        ALTER TABLE parroquia_config ADD COLUMN numeracion_config JSONB DEFAULT '{
            "bautismo": {"formato": "B-{año}-{libro}-{folio}-{registro}", "auto_increment": true, "reinicia_cada_año": true},
            "confirmacion": {"formato": "C-{año}-{libro}-{folio}-{registro}", "auto_increment": true, "reinicia_cada_año": true},
            "matrimonio": {"formato": "M-{año}-{libro}-{folio}-{registro}", "auto_increment": true, "reinicia_cada_año": true},
            "primera_comunion": {"formato": "PC-{año}-{libro}-{folio}-{registro}", "auto_increment": true, "reinicia_cada_año": true}
        }';
    END IF;
    
    -- Configuración avanzada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'notificaciones_config') THEN
        ALTER TABLE parroquia_config ADD COLUMN notificaciones_config JSONB DEFAULT '{"email_enabled": true, "sms_enabled": false, "push_enabled": true}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'backup_config') THEN
        ALTER TABLE parroquia_config ADD COLUMN backup_config JSONB DEFAULT '{"auto_backup": true, "frequency": "weekly", "retention_days": 90}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'reportes_config') THEN
        ALTER TABLE parroquia_config ADD COLUMN reportes_config JSONB DEFAULT '{"logo_en_reportes": true, "mostrar_estadisticas": true, "formato_exportacion": ["pdf", "excel"]}';
    END IF;
    
    -- Control de versiones
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'version_config') THEN
        ALTER TABLE parroquia_config ADD COLUMN version_config SMALLINT DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'configurado_por') THEN
        ALTER TABLE parroquia_config ADD COLUMN configurado_por BIGINT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquia_config' AND column_name = 'ultima_revision') THEN
        ALTER TABLE parroquia_config ADD COLUMN ultima_revision TIMESTAMPTZ;
    END IF;
END $$;

-- ================================================================================
-- EXTENSIÓN DE SECTORES PARROQUIALES
-- ================================================================================

DO $$
BEGIN
    -- Código personalizable por sector
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sector_parroquial' AND column_name = 'codigo_sector') THEN
        ALTER TABLE sector_parroquial ADD COLUMN codigo_sector VARCHAR(20);
    END IF;
    
    -- Información de contacto
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sector_parroquial' AND column_name = 'telefono') THEN
        ALTER TABLE sector_parroquial ADD COLUMN telefono VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sector_parroquial' AND column_name = 'email') THEN
        ALTER TABLE sector_parroquial ADD COLUMN email VARCHAR(255);
    END IF;
    
    -- Coordenadas GPS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sector_parroquial' AND column_name = 'coordenadas_gps') THEN
        ALTER TABLE sector_parroquial ADD COLUMN coordenadas_gps POINT;
    END IF;
    
    -- Responsable del sector
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sector_parroquial' AND column_name = 'responsable_sector') THEN
        ALTER TABLE sector_parroquial ADD COLUMN responsable_sector VARCHAR(200);
    END IF;
    
    -- Horarios de atención
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sector_parroquial' AND column_name = 'horarios_atencion') THEN
        ALTER TABLE sector_parroquial ADD COLUMN horarios_atencion JSONB DEFAULT '{}';
    END IF;
    
    -- Servicios disponibles en el sector
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sector_parroquial' AND column_name = 'servicios_disponibles') THEN
        ALTER TABLE sector_parroquial ADD COLUMN servicios_disponibles JSONB DEFAULT '[]';
    END IF;
    
    -- Estadísticas del sector
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sector_parroquial' AND column_name = 'total_familias') THEN
        ALTER TABLE sector_parroquial ADD COLUMN total_familias INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sector_parroquial' AND column_name = 'total_miembros') THEN
        ALTER TABLE sector_parroquial ADD COLUMN total_miembros INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sector_parroquial' AND column_name = 'ultima_actualizacion_stats') THEN
        ALTER TABLE sector_parroquial ADD COLUMN ultima_actualizacion_stats TIMESTAMPTZ;
    END IF;
    
    -- Control de actividad
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sector_parroquial' AND column_name = 'is_activo') THEN
        ALTER TABLE sector_parroquial ADD COLUMN is_activo BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sector_parroquial' AND column_name = 'created_at') THEN
        ALTER TABLE sector_parroquial ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sector_parroquial' AND column_name = 'updated_at') THEN
        ALTER TABLE sector_parroquial ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- ================================================================================
-- MEJORAS EN SISTEMA DE PERMISOS
-- ================================================================================

DO $$
BEGIN
    -- Permisos extendidos en tr_rol_pagina
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tr_rol_pagina' AND column_name = 'puede_exportar') THEN
        ALTER TABLE tr_rol_pagina ADD COLUMN puede_exportar SMALLINT DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tr_rol_pagina' AND column_name = 'puede_imprimir') THEN
        ALTER TABLE tr_rol_pagina ADD COLUMN puede_imprimir SMALLINT DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tr_rol_pagina' AND column_name = 'restricciones_adicionales') THEN
        ALTER TABLE tr_rol_pagina ADD COLUMN restricciones_adicionales JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tr_rol_pagina' AND column_name = 'created_at') THEN
        ALTER TABLE tr_rol_pagina ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Mejoras en rol_usuario
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rol_usuario' AND column_name = 'nivel_acceso') THEN
        ALTER TABLE rol_usuario ADD COLUMN nivel_acceso SMALLINT DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rol_usuario' AND column_name = 'is_sistema') THEN
        ALTER TABLE rol_usuario ADD COLUMN is_sistema BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Mejoras en pagina
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagina' AND column_name = 'categoria') THEN
        ALTER TABLE pagina ADD COLUMN categoria VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagina' AND column_name = 'icono') THEN
        ALTER TABLE pagina ADD COLUMN icono VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagina' AND column_name = 'orden_menu') THEN
        ALTER TABLE pagina ADD COLUMN orden_menu SMALLINT DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagina' AND column_name = 'is_menu_principal') THEN
        ALTER TABLE pagina ADD COLUMN is_menu_principal BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagina' AND column_name = 'requiere_parroquia') THEN
        ALTER TABLE pagina ADD COLUMN requiere_parroquia BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- ================================================================================
-- MEJORAS EN TABLA USUARIO
-- ================================================================================

DO $$
BEGIN
    -- UUID para usuarios
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario' AND column_name = 'uuid') THEN
        ALTER TABLE usuario ADD COLUMN uuid UUID DEFAULT gen_random_uuid();
    END IF;
    
    -- Avatar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario' AND column_name = 'avatar_url') THEN
        ALTER TABLE usuario ADD COLUMN avatar_url TEXT;
    END IF;
    
    -- Preferencias de usuario
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario' AND column_name = 'preferencias_usuario') THEN
        ALTER TABLE usuario ADD COLUMN preferencias_usuario JSONB DEFAULT '{"tema": "system", "idioma": "es", "notificaciones": true, "dashboard_layout": "default"}';
    END IF;
    
    -- Control de seguridad
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario' AND column_name = 'ultimo_login') THEN
        ALTER TABLE usuario ADD COLUMN ultimo_login TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario' AND column_name = 'intentos_fallidos') THEN
        ALTER TABLE usuario ADD COLUMN intentos_fallidos SMALLINT DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario' AND column_name = 'bloqueado_hasta') THEN
        ALTER TABLE usuario ADD COLUMN bloqueado_hasta TIMESTAMPTZ;
    END IF;
    
    -- Tokens de recuperación
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario' AND column_name = 'token_reset_password') THEN
        ALTER TABLE usuario ADD COLUMN token_reset_password UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario' AND column_name = 'token_reset_expira') THEN
        ALTER TABLE usuario ADD COLUMN token_reset_expira TIMESTAMPTZ;
    END IF;
    
    -- Verificación de email
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario' AND column_name = 'verificado_email') THEN
        ALTER TABLE usuario ADD COLUMN verificado_email BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario' AND column_name = 'token_verificacion') THEN
        ALTER TABLE usuario ADD COLUMN token_verificacion UUID;
    END IF;
    
    -- Timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario' AND column_name = 'updated_at') THEN
        ALTER TABLE usuario ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- ================================================================================
-- ACTUALIZAR DATOS DE PARROQUIAS PILOTO
-- ================================================================================

-- Actualizar parroquia Cristo Resucitado
UPDATE parroquia SET
    codigo_parroquia = 'CR-LOARQUE-001',
    diocesis = 'Arquidiócesis de Tegucigalpa',
    zona_pastoral = 'Zona Centro',
    codigo_diocesano = 'CR001',
    permite_consultas_externas = true,
    parroquias_autorizadas = '["SM-CERROGRANDE-002"]',
    fecha_fundacion = '1985-03-25',
    estado = 1
WHERE id_parroquia = 1;

-- Crear segunda parroquia si no existe
INSERT INTO parroquia (
    nombre, codigo_parroquia, diocesis, zona_pastoral, codigo_diocesano,
    ubicacion, direccion, telefono, email,
    permite_consultas_externas, parroquias_autorizadas,
    fecha_fundacion, estado
) VALUES (
    'Parroquia Salvador del Mundo',
    'SM-CERROGRANDE-002',
    'Arquidiócesis de Tegucigalpa',
    'Zona Centro',
    'SM002',
    '0801',
    'Colonia Cerro Grande, Tegucigalpa, Francisco Morazán',
    '+504 2222-4444',
    'salvador.mundo@arquitegucigalpa.hn',
    true,
    '["CR-LOARQUE-001"]',
    '1978-08-06',
    1
) ON CONFLICT (codigo_parroquia) DO NOTHING;

-- Actualizar configuración de Cristo Resucitado
UPDATE parroquia_config SET
    patron_principal = 'Cristo Resucitado',
    fecha_patron_principal = '2025-03-30',
    parroco_actual = 'Pbro. [Nombre del Párroco]',
    nombre_corto = 'Cristo Resucitado',
    descripcion_parroquia = 'Parroquia ubicada en la Colonia Loarque, sirviendo a la comunidad con el testimonio de Cristo Resucitado.',
    frase_distintiva = 'Cristo vive, Cristo reina, Cristo impera',
    pie_constancia = 'Dada en la Parroquia Cristo Resucitado, Colonia Loarque, Tegucigalpa, a solicitud del interesado.',
    encabezado_constancia = 'ARQUIDIÓCESIS DE TEGUCIGALPA\nPARROQUIA CRISTO RESUCITADO\nColonia Loarque, Tegucigalpa, Francisco Morazán',
    horarios_confesiones = '{
        "sabado": ["16:00-17:30"],
        "domingo": ["08:00-08:45", "10:00-10:45"]
    }',
    horarios_atencion_oficina = '{
        "lunes_viernes": ["08:00-12:00", "14:00-17:00"],
        "sabado": ["08:00-12:00"]
    }',
    mostrar_logo_parroquial = '{
        "en_constancias": true,
        "en_reportes": true,
        "en_dashboard": true,
        "en_header": false,
        "posicion_dashboard": "sidebar_top",
        "tamaño_dashboard": "small"
    }'
WHERE id_parroquia = 1;

-- Crear configuración para Salvador del Mundo si la parroquia existe
INSERT INTO parroquia_config (
    id_parroquia, alias_liturgico, patron_principal, fecha_patron_principal,
    parroco_actual, nombre_corto, descripcion_parroquia, frase_distintiva,
    pie_constancia, encabezado_constancia,
    horarios_confesiones, horarios_atencion_oficina, mostrar_logo_parroquial
)
SELECT 
    2,
    'Parroquia Salvador del Mundo - Colonia Cerro Grande, Tegucigalpa, Francisco Morazán',
    'Salvador del Mundo',
    '2025-08-06',
    'Pbro. [Nombre del Párroco]',
    'Salvador del Mundo',
    'Parroquia ubicada en la Colonia Cerro Grande, proclamando a Jesús como Salvador del Mundo.',
    'Jesús, Salvador del Mundo, en ti confiamos',
    'Dada en la Parroquia Salvador del Mundo, Colonia Cerro Grande, Tegucigalpa, a solicitud del interesado.',
    'ARQUIDIÓCESIS DE TEGUCIGALPA\nPARROQUIA SALVADOR DEL MUNDO\nColonia Cerro Grande, Tegucigalpa, Francisco Morazán',
    '{"sabado": ["15:30-17:00"], "domingo": ["08:30-09:15", "16:00-16:45"]}',
    '{"lunes_viernes": ["08:00-12:00", "14:00-17:00"], "sabado": ["08:00-11:00"]}',
    '{"en_constancias": true, "en_reportes": true, "en_dashboard": true, "en_header": false, "posicion_dashboard": "sidebar_top", "tamaño_dashboard": "small"}'
WHERE EXISTS (SELECT 1 FROM parroquia WHERE id_parroquia = 2)
ON CONFLICT (id_parroquia) DO NOTHING;

-- ================================================================================
-- CREAR TRIGGERS PARA UPDATED_AT
-- ================================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para tablas con updated_at
DO $$
BEGIN
    -- Trigger para parroquia_config
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_parroquia_config_updated_at') THEN
        CREATE TRIGGER trigger_parroquia_config_updated_at
            BEFORE UPDATE ON parroquia_config
            FOR EACH ROW
            EXECUTE FUNCTION actualizar_updated_at();
    END IF;
    
    -- Trigger para sector_parroquial
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_sector_parroquial_updated_at') THEN
        CREATE TRIGGER trigger_sector_parroquial_updated_at
            BEFORE UPDATE ON sector_parroquial
            FOR EACH ROW
            EXECUTE FUNCTION actualizar_updated_at();
    END IF;
    
    -- Trigger para usuario
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_usuario_updated_at') THEN
        CREATE TRIGGER trigger_usuario_updated_at
            BEFORE UPDATE ON usuario
            FOR EACH ROW
            EXECUTE FUNCTION actualizar_updated_at();
    END IF;
END $$;

-- ================================================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- ================================================================================

-- Índices para conectividad federada
CREATE INDEX IF NOT EXISTS idx_parroquia_codigo ON parroquia(codigo_parroquia);
CREATE INDEX IF NOT EXISTS idx_parroquia_diocesis ON parroquia(diocesis);
CREATE INDEX IF NOT EXISTS idx_parroquia_permite_consultas ON parroquia(permite_consultas_externas) WHERE permite_consultas_externas = true;

-- Índices para sectores
CREATE INDEX IF NOT EXISTS idx_sector_codigo ON sector_parroquial(codigo_sector);
CREATE INDEX IF NOT EXISTS idx_sector_activo ON sector_parroquial(is_activo) WHERE is_activo = true;

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuario_uuid ON usuario(uuid);
CREATE INDEX IF NOT EXISTS idx_usuario_ultimo_login ON usuario(ultimo_login);
CREATE INDEX IF NOT EXISTS idx_usuario_verificado_email ON usuario(verificado_email);

-- ================================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ================================================================================

COMMENT ON COLUMN parroquia.codigo_parroquia IS 'Código único para identificación entre parroquias en sistema federado. Formato: [PATRON]-[COLONIA]-[NUM]';
COMMENT ON COLUMN parroquia.diocesis IS 'Arquidiócesis de Tegucigalpa para el piloto inicial del sistema.';
COMMENT ON COLUMN parroquia.parroquias_autorizadas IS 'Lista de códigos de parroquias autorizadas para consultas federadas.';
COMMENT ON COLUMN parroquia.endpoint_notificaciones IS 'URL para recibir notificaciones de otras parroquias del sistema federado.';

COMMENT ON COLUMN parroquia_config.logo_parroquial_url IS 'Logo específico de la parroquia. NO reemplaza la identidad visual del sistema Christi Fideles.';
COMMENT ON COLUMN parroquia_config.mostrar_logo_parroquial IS 'Configuración de dónde y cómo mostrar el logo parroquial sin afectar la marca del sistema.';
COMMENT ON COLUMN parroquia_config.nombre_corto IS 'Nombre corto de la parroquia para mostrar junto al logo del sistema en el UI.';

-- ================================================================================
-- MENSAJE DE COMPLETADO
-- ================================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '📊 Campos agregados a parroquia: codigo_parroquia, diocesis, conectividad federada';
    RAISE NOTICE '⚙️ Campos agregados a parroquia_config: configuración extendida, logo parroquial, horarios';
    RAISE NOTICE '🏗️ Campos agregados a sector_parroquial: códigos, contacto, estadísticas';
    RAISE NOTICE '👤 Campos agregados a usuario: preferencias, seguridad, tokens';
    RAISE NOTICE '🛡️ Campos agregados a permisos: exportar, imprimir, restricciones';
    RAISE NOTICE '⛪ Parroquias piloto actualizadas: Cristo Resucitado y Salvador del Mundo';
    RAISE NOTICE '🔧 Triggers e índices creados para optimización';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 PRÓXIMO PASO: Ejecutar "npx prisma db pull" para actualizar el schema de Prisma';
END $$;