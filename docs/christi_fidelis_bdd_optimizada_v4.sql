-- ================================================================================
-- ESTRUCTURA DE BASE DE DATOS OPTIMIZADA v4.0
-- Sistema Christi Fideles - Optimizada para Módulo de Configuración
-- Fecha: Enero 2025
-- ================================================================================

-- Configuración base de PostgreSQL
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ================================================================================
-- TABLA BASE: UBICACIÓN GEOGRÁFICA
-- ================================================================================

CREATE TABLE departamento (
    codigo_departamento CHAR(2) PRIMARY KEY,
    nombre_departamento VARCHAR(55) NOT NULL
);

CREATE TABLE municipio (
    codigo_municipio CHAR(4) PRIMARY KEY,
    codigo_departamento CHAR(2) NOT NULL,
    nombre_municipio VARCHAR(55) NOT NULL,
    FOREIGN KEY (codigo_departamento) REFERENCES departamento(codigo_departamento)
);

-- ================================================================================
-- TABLA CENTRAL: PARROQUIA (Multi-tenant)
-- ================================================================================

CREATE TABLE parroquia (
    id_parroquia SMALLSERIAL PRIMARY KEY,
    
    -- DATOS BÁSICOS PARA MULTI-TENANCY E IDENTIFICACIÓN
    nombre VARCHAR(100) NOT NULL, -- Nombre oficial registral
    ubicacion CHAR(4) NOT NULL, -- Código de municipio
    direccion VARCHAR(1000) NOT NULL, -- Dirección física oficial
    telefono VARCHAR(100) NOT NULL, -- Teléfono principal de contacto
    email VARCHAR(255), -- Email oficial de contacto
    
    -- DATOS PARA FEDERACIÓN DE BD Y CONECTIVIDAD ENTRE PARROQUIAS
    codigo_parroquia VARCHAR(20) UNIQUE, -- Código único para identificación inter-parroquial
    diocesis VARCHAR(100), -- Diócesis a la que pertenece
    zona_pastoral VARCHAR(50), -- Zona pastoral o vicaria
    codigo_diocesano VARCHAR(20), -- Código asignado por la diócesis
    
    -- CONFIGURACIÓN DE CONECTIVIDAD (Para notificaciones y consultas entre parroquias)
    endpoint_notificaciones TEXT, -- URL para recibir notificaciones de otras parroquias
    api_key_publica VARCHAR(200), -- Clave pública para autenticación inter-parroquial
    permite_consultas_externas BOOLEAN DEFAULT FALSE, -- Permite consultas de otras parroquias
    parroquias_autorizadas JSONB DEFAULT '[]', -- Lista de parroquias autorizadas a consultar
    
    -- METADATOS DEL SISTEMA
    estado SMALLINT DEFAULT 1, -- 1: Activa, 2: Suspendida, 3: Trasladada
    fecha_fundacion DATE, -- Fecha de fundación canónica
    fecha_registro_sistema TIMESTAMPTZ DEFAULT NOW(), -- Fecha de registro en el sistema
    
    -- CONTROL DE CAMBIOS
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (ubicacion) REFERENCES municipio(codigo_municipio)
);

-- ================================================================================
-- CONFIGURACIÓN AVANZADA DE PARROQUIA (Optimizada para módulo configuración)
-- ================================================================================

CREATE TABLE parroquia_config (
    id_parroquia SMALLINT PRIMARY KEY,
    
    -- ================================================================================
    -- CONFIGURACIÓN PARA DOCUMENTOS OFICIALES Y CONSTANCIAS
    -- ================================================================================
    
    -- Información litúrgica que aparece en constancias
    alias_liturgico VARCHAR(150), -- "Parroquia San José - Tegucigalpa, Francisco Morazán"
    patron_principal VARCHAR(150), -- Nombre del santo patrón principal
    fecha_patron_principal DATE, -- Fecha de celebración del patrón
    patron_secundario VARCHAR(150), -- Santo patrón secundario (si aplica)
    fecha_patron_secundario DATE,
    
    -- Información del párroco (para constancias)
    parroco_actual VARCHAR(200), -- Nombre completo del párroco actual
    parroco_desde DATE, -- Fecha desde que es párroco
    vicario_parroquial VARCHAR(200), -- Vicario parroquial (si aplica)
    
    -- Assets visuales para documentos y identificación parroquial
    logo_parroquial_url TEXT, -- Logo específico de la parroquia (NO reemplaza logo del sistema)
    sello_digital_url TEXT, -- Sello parroquial digital para documentos oficiales
    firma_parroco_url TEXT, -- Firma digitalizada del párroco
    membrete_url TEXT, -- Membrete oficial para documentos
    escudo_diocesano_url TEXT, -- Escudo de la diócesis
    
    -- Configuración de ubicación del logo parroquial en el sistema
    mostrar_logo_parroquial JSONB DEFAULT '{
        "en_constancias": true,
        "en_reportes": true, 
        "en_dashboard": true,
        "en_header": false,
        "posicion_dashboard": "sidebar_top",
        "tamaño_dashboard": "small"
    }',
    
    -- Configuración de documentos y constancias
    pie_constancia TEXT DEFAULT 'Dada en la Parroquia, a solicitud del interesado.', -- Texto estándar
    encabezado_constancia TEXT, -- Encabezado personalizado
    formato_numeracion_constancias VARCHAR(50) DEFAULT '{tipo}-{año}-{numero}',
    
    -- ================================================================================
    -- CONFIGURACIÓN DE HORARIOS Y SERVICIOS (Para constancias de disponibilidad)
    -- ================================================================================
    
    horarios_misas JSONB DEFAULT '{
        "domingo": ["07:00", "09:00", "11:00", "18:00"],
        "lunes_viernes": ["06:30", "18:00"],
        "sabado": ["18:00"]
    }',
    
    horarios_confesiones JSONB DEFAULT '{
        "sabado": ["16:00-17:30"],
        "domingo": ["08:00-08:45", "10:00-10:45"]
    }',
    
    horarios_atencion_oficina JSONB DEFAULT '{
        "lunes_viernes": ["08:00-12:00", "14:00-17:00"],
        "sabado": ["08:00-12:00"]
    }',
    
    servicios_disponibles JSONB DEFAULT '[
        "bautismos", "confirmaciones", "matrimonios", "primera_comunion",
        "uncion_enfermos", "confesiones", "misas_difuntos"
    ]',
    
    -- ================================================================================
    -- CONFIGURACIÓN DE IDENTIDAD PARROQUIAL (SIN AFECTAR IDENTIDAD DEL SISTEMA)
    -- ================================================================================
    
    -- Información específica de la parroquia para mostrar en el sistema
    nombre_corto VARCHAR(50), -- Nombre corto para mostrar en UI (ej: "San José")
    descripcion_parroquia TEXT, -- Descripción breve de la parroquia
    frase_distintiva VARCHAR(200), -- Frase o lema de la parroquia
    
    -- NOTA: NO incluimos configuración de colores/temas porque el sistema 
    -- mantiene identidad visual única de Christi Fideles
    
    -- ================================================================================
    -- CONFIGURACIÓN REGIONAL Y FORMATO
    -- ================================================================================
    
    -- Configuración regional
    timezone VARCHAR(50) DEFAULT 'America/Tegucigalpa',
    idioma CHAR(2) DEFAULT 'es',
    formato_fecha VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    formato_hora VARCHAR(20) DEFAULT 'HH:mm',
    moneda CHAR(3) DEFAULT 'HNL',
    
    -- Configuración de constancias por defecto
    formato_papel VARCHAR(10) DEFAULT 'letter', -- letter, legal, A4
    orientacion_papel VARCHAR(10) DEFAULT 'portrait', -- portrait, landscape
    margenes_documento JSONB DEFAULT '{
        "top": 2.5, "right": 2.5, "bottom": 2.5, "left": 2.5
    }',
    
    -- ================================================================================
    -- CONFIGURACIÓN DE NUMERACIÓN PARA SACRAMENTOS
    -- ================================================================================
    
    numeracion_config JSONB DEFAULT '{
        "bautismo": {
            "formato": "B-{año}-{libro}-{folio}-{registro}", 
            "auto_increment": true,
            "reinicia_cada_año": true
        },
        "confirmacion": {
            "formato": "C-{año}-{libro}-{folio}-{registro}", 
            "auto_increment": true,
            "reinicia_cada_año": true
        },
        "matrimonio": {
            "formato": "M-{año}-{libro}-{folio}-{registro}", 
            "auto_increment": true,
            "reinicia_cada_año": true
        },
        "primera_comunion": {
            "formato": "PC-{año}-{libro}-{folio}-{registro}", 
            "auto_increment": true,
            "reinicia_cada_año": true
        }
    }',
    
    -- ================================================================================
    -- CONFIGURACIÓN AVANZADA DEL SISTEMA
    -- ================================================================================
    
    -- Configuración de notificaciones
    notificaciones_config JSONB DEFAULT '{
        "email_enabled": true,
        "sms_enabled": false,
        "push_enabled": true,
        "templates": {
            "bautismo_confirmado": "Su solicitud de bautismo ha sido confirmada",
            "matrimonio_pendiente": "Documentos pendientes para matrimonio"
        }
    }',
    
    -- Configuración de backup y seguridad
    backup_config JSONB DEFAULT '{
        "auto_backup": true,
        "frequency": "weekly",
        "retention_days": 90,
        "backup_location": "local"
    }',
    
    -- Configuración de reportes
    reportes_config JSONB DEFAULT '{
        "logo_en_reportes": true,
        "mostrar_estadisticas": true,
        "formato_exportacion": ["pdf", "excel"]
    }',
    
    -- Opciones generales del sistema (para funcionalidades específicas)
    opciones_sistema JSONB DEFAULT '{
        "permitir_edicion_fechas_antiguas": false,
        "validar_documentos_obligatorios": true,
        "generar_codigo_qr_constancias": true
    }',
    
    -- ================================================================================
    -- CONTROL DE VERSIONES Y METADATOS
    -- ================================================================================
    
    version_config SMALLINT DEFAULT 1, -- Versión de la configuración
    configurado_por BIGINT, -- Usuario que realizó la última configuración
    ultima_revision TIMESTAMPTZ, -- Fecha de última revisión de configuración
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (id_parroquia) REFERENCES parroquia(id_parroquia) ON DELETE CASCADE,
    FOREIGN KEY (configurado_por) REFERENCES usuario(id_usuario)
);

-- ================================================================================
-- PARÁMETROS DINÁMICOS DE PARROQUIA
-- ================================================================================

CREATE TABLE parroquia_parametro (
    id BIGSERIAL PRIMARY KEY,
    id_parroquia SMALLINT NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- 'liturgico', 'apariencia', 'sistema', 'custom'
    clave VARCHAR(100) NOT NULL,
    valor JSONB DEFAULT '{}',
    descripcion TEXT,
    tipo_dato VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json', 'date'
    is_publico BOOLEAN DEFAULT FALSE,
    is_editable BOOLEAN DEFAULT TRUE,
    validacion_regex VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_parroquia) REFERENCES parroquia(id_parroquia) ON DELETE CASCADE,
    UNIQUE(id_parroquia, categoria, clave)
);

-- ================================================================================
-- SISTEMA DE ROLES Y PERMISOS GRANULAR
-- ================================================================================

CREATE TABLE rol_usuario (
    id_rol SMALLSERIAL PRIMARY KEY,
    nombre VARCHAR(55) NOT NULL,
    descripcion VARCHAR(500),
    nivel_acceso SMALLINT DEFAULT 1, -- 1: Básico, 2: Intermedio, 3: Avanzado, 4: Admin
    is_sistema BOOLEAN DEFAULT FALSE, -- Roles del sistema no editables
    estado SMALLINT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    id_usuario_creacion BIGINT
);

CREATE TABLE pagina (
    id_pagina SMALLSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    url VARCHAR(500) NOT NULL,
    categoria VARCHAR(50), -- 'sacramentos', 'personas', 'configuracion', 'reportes'
    icono VARCHAR(50),
    orden_menu SMALLINT DEFAULT 1,
    is_menu_principal BOOLEAN DEFAULT TRUE,
    requiere_parroquia BOOLEAN DEFAULT TRUE,
    estado SMALLINT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    id_usuario_creacion BIGINT
);

-- Permisos granulares por página y rol
CREATE TABLE tr_rol_pagina (
    id_rol SMALLINT,
    id_pagina SMALLINT,
    puede_ver SMALLINT DEFAULT 1,
    puede_crear SMALLINT DEFAULT 0,
    puede_actualizar SMALLINT DEFAULT 0,
    puede_borrar SMALLINT DEFAULT 0,
    puede_exportar SMALLINT DEFAULT 0,
    puede_imprimir SMALLINT DEFAULT 0,
    restricciones_adicionales JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id_rol, id_pagina),
    FOREIGN KEY (id_rol) REFERENCES rol_usuario(id_rol),
    FOREIGN KEY (id_pagina) REFERENCES pagina(id_pagina)
);

-- ================================================================================
-- USUARIOS CON CONFIGURACIÓN PERSONAL
-- ================================================================================

CREATE TABLE usuario (
    id_usuario BIGSERIAL PRIMARY KEY,
    id_parroquia SMALLINT NOT NULL,
    id_rol SMALLINT NOT NULL,
    uuid UUID DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    contrasena BYTEA NOT NULL,
    telefono VARCHAR(100),
    avatar_url TEXT,
    
    -- Configuración personal del usuario
    preferencias_usuario JSONB DEFAULT '{
        "tema": "system",
        "idioma": "es",
        "notificaciones": true,
        "dashboard_layout": "default"
    }',
    
    -- Control de sesión y seguridad
    ultimo_login TIMESTAMPTZ,
    intentos_fallidos SMALLINT DEFAULT 0,
    bloqueado_hasta TIMESTAMPTZ,
    token_reset_password UUID,
    token_reset_expira TIMESTAMPTZ,
    verificado_email BOOLEAN DEFAULT FALSE,
    token_verificacion UUID,
    
    estado SMALLINT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    id_usuario_creacion BIGINT,
    
    FOREIGN KEY (id_parroquia) REFERENCES parroquia(id_parroquia),
    FOREIGN KEY (id_rol) REFERENCES rol_usuario(id_rol)
);

-- ================================================================================
-- SECTORES PARROQUIALES MEJORADOS
-- ================================================================================

CREATE TABLE tipo_sector_parroquial (
    id_tipo_sector_parroquial SMALLSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(50),
    color VARCHAR(7) DEFAULT '#3B82F6',
    orden_display SMALLINT DEFAULT 1,
    is_activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE sector_parroquial (
    id_sector_parroquial BIGSERIAL PRIMARY KEY,
    id_parroquia SMALLINT NOT NULL,
    id_tipo_sector_parroquial SMALLINT NOT NULL,
    codigo_sector VARCHAR(20), -- Código personalizable por parroquia
    nombre VARCHAR(100) NOT NULL,
    nombre_capilla VARCHAR(100),
    direccion TEXT NOT NULL,
    coordenadas_gps POINT,
    telefono VARCHAR(100),
    email VARCHAR(255),
    
    -- Información adicional del sector
    responsable_sector VARCHAR(200),
    horarios_atencion JSONB DEFAULT '{}',
    servicios_disponibles JSONB DEFAULT '[]',
    
    -- Estadísticas del sector
    total_familias INTEGER DEFAULT 0,
    total_miembros INTEGER DEFAULT 0,
    ultima_actualizacion_stats TIMESTAMPTZ,
    
    -- Control
    is_activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (id_parroquia) REFERENCES parroquia(id_parroquia),
    FOREIGN KEY (id_tipo_sector_parroquial) REFERENCES tipo_sector_parroquial(id_tipo_sector_parroquial),
    UNIQUE(id_parroquia, codigo_sector)
);

-- ================================================================================
-- ÓRDENES RELIGIOSAS
-- ================================================================================

CREATE TABLE orden_religiosa (
    id_orden_religiosa SMALLSERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    nombre_latin VARCHAR(100),
    abreviatura VARCHAR(15),
    descripcion TEXT,
    rama CHAR(1) NOT NULL, -- M: Masculina, F: Femenina, L: Laical
    fundacion_año SMALLINT,
    carisma TEXT,
    sitio_web VARCHAR(255),
    is_activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE rango_orden_sacerdotal (
    id_rango_sacerdotal SMALLSERIAL PRIMARY KEY,
    nombre VARCHAR(55) NOT NULL,
    descripcion TEXT,
    nivel_jerarquico SMALLINT DEFAULT 1,
    puede_administrar_sacramentos JSONB DEFAULT '[]'
);

-- ================================================================================
-- PERSONAS - TABLA MADRE FUNDAMENTAL
-- ================================================================================

CREATE TABLE persona (
    numero_identidad VARCHAR(20) NOT NULL,
    id_parroquia SMALLINT NOT NULL,
    id_sector_parroquial BIGINT NOT NULL,
    id_orden_religiosa SMALLINT NOT NULL,
    nombres VARCHAR(55) NOT NULL,
    apellidos VARCHAR(55) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    lugar_nacimiento CHAR(4) NOT NULL,
    sexo CHAR(1) NOT NULL CHECK (sexo IN ('M', 'F')),
    telefono VARCHAR(100) NOT NULL,
    email CITEXT,
    direccion TEXT,
    
    -- Estados de la persona
    estado_vital SMALLINT DEFAULT 1, -- 1: Vivo, 2: Fallecido
    estado_activo_parroquia SMALLINT DEFAULT 1, -- 1: Activo, 2: Inactivo, 3: Trasladado
    
    -- Información religiosa
    otra_orden_religiosa VARCHAR(255), -- Si pertenece a otra orden no registrada
    
    -- Información adicional
    imagen TEXT, -- URL de la foto
    observaciones TEXT,
    
    -- Control de cambios
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (id_parroquia, numero_identidad),
    FOREIGN KEY (id_parroquia) REFERENCES parroquia(id_parroquia),
    FOREIGN KEY (id_sector_parroquial) REFERENCES sector_parroquial(id_sector_parroquial),
    FOREIGN KEY (id_orden_religiosa) REFERENCES orden_religiosa(id_orden_religiosa),
    FOREIGN KEY (lugar_nacimiento) REFERENCES municipio(codigo_municipio)
);

-- Índices para optimizar consultas de personas
CREATE INDEX idx_persona_parroquia_apellidos ON persona(id_parroquia, apellidos);
CREATE INDEX idx_persona_numero_identidad ON persona(numero_identidad);
CREATE INDEX idx_persona_sector ON persona(id_sector_parroquial);
CREATE INDEX idx_persona_email ON persona(email) WHERE email IS NOT NULL;

-- ================================================================================
-- ORDEN SACERDOTAL - INFORMACIÓN ESPECÍFICA DE SACERDOTES
-- (Requiere registro previo en tabla persona)
-- ================================================================================

CREATE TABLE orden_sacerdotal (
    -- Clave primaria: referencia a persona existente
    numero_identidad VARCHAR(20) NOT NULL,
    id_parroquia SMALLINT NOT NULL,
    
    -- Información específica sacerdotal
    id_rango_sacerdotal SMALLINT NOT NULL,
    id_orden_religiosa_sacerdotal SMALLINT NOT NULL, -- Puede ser diferente a la de laico
    
    -- Información pastoral
    es_parroco SMALLINT DEFAULT 0 CHECK (es_parroco IN (0, 1)),
    fecha_ordenacion DATE,
    lugar_ordenacion VARCHAR(200),
    obispo_ordenante VARCHAR(200),
    
    -- Asignaciones y ministerios
    parroquia_asignada SMALLINT, -- Puede ser diferente a la parroquia de registro
    ministerios_especiales JSONB DEFAULT '[]', -- Array de ministerios
    
    -- Formación y estudios
    seminario_formacion VARCHAR(200),
    estudios_realizados JSONB DEFAULT '[]',
    especialidades JSONB DEFAULT '[]',
    
    -- Estado sacerdotal
    estado_sacerdotal SMALLINT DEFAULT 1, -- 1: Activo, 2: Suspendido, 3: Retirado
    fecha_suspension DATE,
    motivo_suspension TEXT,
    
    -- Información adicional
    biografia TEXT,
    fecha_fallecimiento DATE,
    
    -- Control de cambios
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (id_parroquia, numero_identidad),
    
    -- CONSTRAINT FUNDAMENTAL: Debe existir primero como persona
    FOREIGN KEY (id_parroquia, numero_identidad) 
        REFERENCES persona(id_parroquia, numero_identidad) 
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    FOREIGN KEY (id_rango_sacerdotal) 
        REFERENCES rango_orden_sacerdotal(id_rango_sacerdotal),
        
    FOREIGN KEY (id_orden_religiosa_sacerdotal) 
        REFERENCES orden_religiosa(id_orden_religiosa),
        
    FOREIGN KEY (parroquia_asignada) 
        REFERENCES parroquia(id_parroquia)
);

-- Índices para orden sacerdotal
CREATE INDEX idx_orden_sacerdotal_rango ON orden_sacerdotal(id_rango_sacerdotal);
CREATE INDEX idx_orden_sacerdotal_parroco ON orden_sacerdotal(es_parroco) WHERE es_parroco = 1;
CREATE INDEX idx_orden_sacerdotal_estado ON orden_sacerdotal(estado_sacerdotal);

-- ================================================================================
-- GRUPOS Y ROLES PARROQUIALES 
-- ================================================================================

CREATE TABLE grupo_parroquial (
    id_grupo_parroquial SMALLSERIAL PRIMARY KEY,
    id_parroquia SMALLINT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_grupo VARCHAR(50), -- 'ministerio', 'movimiento', 'comision', 'coro', etc.
    responsable_identidad VARCHAR(20), -- Referencia a persona responsable
    responsable_parroquia SMALLINT,
    fecha_fundacion DATE,
    is_activo BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (id_parroquia) REFERENCES parroquia(id_parroquia),
    FOREIGN KEY (responsable_parroquia, responsable_identidad) 
        REFERENCES persona(id_parroquia, numero_identidad)
);

CREATE TABLE rol_parroquial (
    id_rol_parroquial SMALLSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    nivel_responsabilidad SMALLINT DEFAULT 1, -- 1: Miembro, 2: Coordinador, 3: Líder
    permisos_especiales JSONB DEFAULT '{}'
);

CREATE TABLE tr_persona_grupo_rol (
    numero_identidad VARCHAR(20) NOT NULL,
    id_parroquia SMALLINT NOT NULL,
    id_grupo_parroquial SMALLINT NOT NULL,
    id_rol_parroquial SMALLINT NOT NULL,
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    fecha_salida DATE,
    is_activo BOOLEAN DEFAULT TRUE,
    observaciones TEXT,
    
    PRIMARY KEY (id_parroquia, numero_identidad, id_grupo_parroquial, id_rol_parroquial),
    
    FOREIGN KEY (id_parroquia, numero_identidad) 
        REFERENCES persona(id_parroquia, numero_identidad),
    FOREIGN KEY (id_grupo_parroquial) 
        REFERENCES grupo_parroquial(id_grupo_parroquial),
    FOREIGN KEY (id_rol_parroquial) 
        REFERENCES rol_parroquial(id_rol_parroquial)
);

-- ================================================================================
-- TABLA DE NUMERADORES MEJORADA
-- ================================================================================

CREATE TABLE numeradores (
    id BIGSERIAL PRIMARY KEY,
    id_parroquia SMALLINT NOT NULL,
    modulo VARCHAR(50) NOT NULL, -- 'bautismo', 'confirmacion', 'matrimonio', etc.
    scope VARCHAR(50) DEFAULT 'general', -- 'general', 'sector', 'año'
    scope_value VARCHAR(50), -- Valor del scope (ej: id_sector, año)
    
    -- Contadores
    ultimo_libro INTEGER DEFAULT 0,
    ultimo_folio INTEGER DEFAULT 0,
    ultimo_acta INTEGER DEFAULT 0,
    ultimo_registro INTEGER DEFAULT 0,
    
    -- Configuración del numerador
    formato_numero VARCHAR(100) DEFAULT '{modulo}-{año}-{libro}-{folio}-{registro}',
    reinicia_cada_año BOOLEAN DEFAULT TRUE,
    
    -- Control
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (id_parroquia) REFERENCES parroquia(id_parroquia) ON DELETE CASCADE,
    UNIQUE(id_parroquia, modulo, scope, scope_value)
);

-- ================================================================================
-- PLANTILLAS DE CONSTANCIAS MEJORADAS
-- ================================================================================

CREATE TABLE plantilla_constancia (
    id BIGSERIAL PRIMARY KEY,
    id_parroquia SMALLINT NOT NULL,
    sacramento VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    contenido TEXT NOT NULL,
    variables_disponibles JSONB DEFAULT '[]',
    formato_salida VARCHAR(20) DEFAULT 'pdf', -- 'pdf', 'docx', 'html'
    orientacion VARCHAR(10) DEFAULT 'portrait',
    tamaño_papel VARCHAR(10) DEFAULT 'letter',
    margenes JSONB DEFAULT '{"top": 2.5, "right": 2.5, "bottom": 2.5, "left": 2.5}',
    
    -- Control de versiones
    version SMALLINT DEFAULT 1,
    es_version_activa BOOLEAN DEFAULT TRUE,
    plantilla_padre_id BIGINT,
    
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (id_parroquia) REFERENCES parroquia(id_parroquia) ON DELETE CASCADE,
    FOREIGN KEY (plantilla_padre_id) REFERENCES plantilla_constancia(id)
);

-- ================================================================================
-- SISTEMA DE AUDITORÍA Y BITÁCORAS MEJORADO
-- ================================================================================

CREATE TABLE bitacora_crud (
    id_accion BIGSERIAL PRIMARY KEY,
    id_parroquia SMALLINT NOT NULL,
    id_usuario BIGINT NOT NULL,
    accion CHAR(1) NOT NULL, -- C: Create, R: Read, U: Update, D: Delete
    modulo VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(100) NOT NULL,
    id_registro_afectado BIGINT,
    
    -- Datos del cambio
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    campos_modificados TEXT[],
    
    -- Información de contexto
    ip_address INET,
    user_agent TEXT,
    sesion_id UUID,
    motivo_cambio TEXT,
    
    -- Metadatos
    duracion_operacion_ms INTEGER,
    resultado_operacion VARCHAR(20) DEFAULT 'success', -- 'success', 'error', 'warning'
    mensaje_error TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (id_parroquia) REFERENCES parroquia(id_parroquia),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Índices para mejorar rendimiento de auditoría
CREATE INDEX idx_bitacora_crud_parroquia_fecha ON bitacora_crud(id_parroquia, created_at);
CREATE INDEX idx_bitacora_crud_usuario_fecha ON bitacora_crud(id_usuario, created_at);
CREATE INDEX idx_bitacora_crud_tabla_fecha ON bitacora_crud(tabla_afectada, created_at);
CREATE INDEX idx_bitacora_crud_modulo_fecha ON bitacora_crud(modulo, created_at);

-- ================================================================================
-- TRIGGERS Y FUNCIONES ÚTILES
-- ================================================================================

-- Función para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para parroquia_config
CREATE TRIGGER trigger_parroquia_config_updated_at
    BEFORE UPDATE ON parroquia_config
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

-- Trigger para parroquia_parametro
CREATE TRIGGER trigger_parroquia_parametro_updated_at
    BEFORE UPDATE ON parroquia_parametro
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

-- Trigger para usuario
CREATE TRIGGER trigger_usuario_updated_at
    BEFORE UPDATE ON usuario
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

-- Trigger para persona
CREATE TRIGGER trigger_persona_updated_at
    BEFORE UPDATE ON persona
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

-- Trigger para orden_sacerdotal
CREATE TRIGGER trigger_orden_sacerdotal_updated_at
    BEFORE UPDATE ON orden_sacerdotal
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

-- ================================================================================
-- DATOS INICIALES PARA EL SISTEMA
-- ================================================================================

-- Tipos de sectores parroquiales por defecto
INSERT INTO tipo_sector_parroquial (nombre, descripcion, icono, color) VALUES
('Sector Urbano', 'Sectores dentro del área urbana de la parroquia', 'building', '#3B82F6'),
('Sector Rural', 'Sectores en áreas rurales y aldeas', 'tree', '#059669'),
('Capilla', 'Capillas auxiliares de la parroquia', 'church', '#DC2626'),
('Comunidad', 'Comunidades o barrios específicos', 'users', '#7C3AED'),
('Misión', 'Estaciones misioneras', 'map-pin', '#EA580C');

-- Rangos de orden sacerdotal
INSERT INTO rango_orden_sacerdotal (nombre, descripcion, nivel_jerarquico, puede_administrar_sacramentos) VALUES
('Obispo', 'Obispo diocesano o auxiliar', 5, '["bautismo", "confirmacion", "matrimonio", "orden_sacerdotal", "uncion_enfermos"]'),
('Presbítero', 'Sacerdote con todas las facultades', 4, '["bautismo", "confirmacion", "matrimonio", "uncion_enfermos"]'),
('Diácono Permanente', 'Diácono permanente', 3, '["bautismo", "matrimonio"]'),
('Diácono Transitorio', 'Diácono en formación sacerdotal', 2, '["bautismo"]'),
('Seminarista', 'Estudiante de seminario', 1, '[]');

-- Órdenes religiosas de ejemplo
INSERT INTO orden_religiosa (nombre, nombre_latin, abreviatura, descripcion, rama, fundacion_año, carisma) VALUES
('Secular', 'Clero Secular', 'SEC', 'Clero diocesano secular', 'M', NULL, 'Pastoral diocesana'),
('Franciscanos', 'Ordo Fratrum Minorum', 'OFM', 'Orden de los Hermanos Menores', 'M', 1209, 'Pobreza evangélica y servicio a los pobres'),
('Dominicos', 'Ordo Praedicatorum', 'OP', 'Orden de Predicadores', 'M', 1216, 'Predicación y enseñanza'),
('Jesuitas', 'Societas Iesu', 'SJ', 'Compañía de Jesús', 'M', 1540, 'Educación y misiones'),
('Laicos', 'Laicos', 'LAI', 'Fieles laicos', 'L', NULL, 'Apostolado laical');

-- Roles de usuario por defecto
INSERT INTO rol_usuario (nombre, descripcion, nivel_acceso, is_sistema) VALUES
('Super Administrador', 'Acceso completo al sistema', 4, TRUE),
('Administrador Parroquial', 'Administración completa de la parroquia', 3, TRUE),
('Secretario Parroquial', 'Gestión de registros sacramentales', 2, TRUE),
('Asistente', 'Acceso limitado para consultas', 1, TRUE),
('Párroco', 'Párroco de la parroquia', 4, TRUE);

-- Crear sectores parroquiales para Cristo Resucitado
INSERT INTO sector_parroquial (
    id_parroquia, id_tipo_sector_parroquial, codigo_sector, nombre, direccion,
    responsable_sector, is_activo
) VALUES 
(1, 1, 'CR-SECTOR-01', 'Sector Central Loarque', 'Colonia Loarque Centro, Tegucigalpa', 'Coordinador a designar', true),
(1, 1, 'CR-SECTOR-02', 'Sector Norte Loarque', 'Colonia Loarque Norte, Tegucigalpa', 'Coordinador a designar', true),
(1, 1, 'CR-SECTOR-03', 'Sector Sur Loarque', 'Colonia Loarque Sur, Tegucigalpa', 'Coordinador a designar', true),
(1, 3, 'CR-CAPILLA-01', 'Capilla San José Obrero', 'Sector Norte, Colonia Loarque', 'Encargado a designar', true);

-- Crear sectores parroquiales para Salvador del Mundo
INSERT INTO sector_parroquial (
    id_parroquia, id_tipo_sector_parroquial, codigo_sector, nombre, direccion,
    responsable_sector, is_activo
) VALUES
(2, 1, 'SM-SECTOR-01', 'Sector Central Cerro Grande', 'Colonia Cerro Grande Centro, Tegucigalpa', 'Coordinador a designar', true),
(2, 1, 'SM-SECTOR-02', 'Sector Este Cerro Grande', 'Colonia Cerro Grande Este, Tegucigalpa', 'Coordinador a designar', true),
(2, 1, 'SM-SECTOR-03', 'Sector Oeste Cerro Grande', 'Colonia Cerro Grande Oeste, Tegucigalpa', 'Coordinador a designar', true),
(2, 3, 'SM-CAPILLA-01', 'Capilla Inmaculado Corazón', 'Sector Este, Colonia Cerro Grande', 'Encargado a designar', true);

-- ================================================================================
-- PARROQUIAS PILOTO DE LA ARQUIDIÓCESIS DE TEGUCIGALPA
-- ================================================================================

-- Insertar parroquia piloto principal
INSERT INTO parroquia (
    id_parroquia, nombre, ubicacion, direccion, telefono, email,
    codigo_parroquia, diocesis, zona_pastoral, codigo_diocesano,
    permite_consultas_externas, parroquias_autorizadas,
    fecha_fundacion, estado
) VALUES 
(1, 'Parroquia Cristo Resucitado', '0801', 
 'Colonia Loarque, Tegucigalpa, Francisco Morazán', 
 '+504 2222-3333', 'cristo.resucitado@arquitegucigalpa.hn',
 'CR-LOARQUE-001', 'Arquidiócesis de Tegucigalpa', 'Zona Centro', 'CR001',
 true, '["SM-CERROGRANDE-002"]', '1985-03-25', 1),

(2, 'Parroquia Salvador del Mundo', '0801',
 'Colonia Cerro Grande, Tegucigalpa, Francisco Morazán',
 '+504 2222-4444', 'salvador.mundo@arquitegucigalpa.hn', 
 'SM-CERROGRANDE-002', 'Arquidiócesis de Tegucigalpa', 'Zona Centro', 'SM002',
 true, '["CR-LOARQUE-001"]', '1978-08-06', 1);

-- Configuración específica para Cristo Resucitado (Parroquia piloto principal)
INSERT INTO parroquia_config (
    id_parroquia, alias_liturgico, patron_principal, fecha_patron_principal,
    parroco_actual, nombre_corto, descripcion_parroquia, frase_distintiva,
    horarios_misas, horarios_confesiones, horarios_atencion_oficina,
    pie_constancia, encabezado_constancia,
    mostrar_logo_parroquial, timezone, idioma
) VALUES (
    1, 
    'Parroquia Cristo Resucitado - Colonia Loarque, Tegucigalpa, Francisco Morazán',
    'Cristo Resucitado', 
    '2025-03-30', -- Domingo de Resurrección (fecha variable)
    'Pbro. [Nombre del Párroco]', 
    'Cristo Resucitado',
    'Parroquia ubicada en la Colonia Loarque, sirviendo a la comunidad con el testimonio de Cristo Resucitado.',
    'Cristo vive, Cristo reina, Cristo impera',
    '{
        "domingo": ["07:00", "09:00", "11:00", "18:00"],
        "lunes_viernes": ["06:30", "18:00"],
        "sabado": ["18:00"]
    }',
    '{
        "sabado": ["16:00-17:30"],
        "domingo": ["08:00-08:45", "10:00-10:45"]
    }',
    '{
        "lunes_viernes": ["08:00-12:00", "14:00-17:00"],
        "sabado": ["08:00-12:00"]
    }',
    'Dada en la Parroquia Cristo Resucitado, Colonia Loarque, Tegucigalpa, a solicitud del interesado.',
    'ARQUIDIÓCESIS DE TEGUCIGALPA\nPARROQUIA CRISTO RESUCITADO\nColonia Loarque, Tegucigalpa, Francisco Morazán',
    '{
        "en_constancias": true,
        "en_reportes": true, 
        "en_dashboard": true,
        "en_header": false,
        "posicion_dashboard": "sidebar_top",
        "tamaño_dashboard": "small"
    }',
    'America/Tegucigalpa',
    'es'
);

-- Configuración específica para Salvador del Mundo (Parroquia piloto secundaria)
INSERT INTO parroquia_config (
    id_parroquia, alias_liturgico, patron_principal, fecha_patron_principal,
    parroco_actual, nombre_corto, descripcion_parroquia, frase_distintiva,
    horarios_misas, horarios_confesiones, horarios_atencion_oficina,
    pie_constancia, encabezado_constancia,
    mostrar_logo_parroquial, timezone, idioma
) VALUES (
    2,
    'Parroquia Salvador del Mundo - Colonia Cerro Grande, Tegucigalpa, Francisco Morazán',
    'Salvador del Mundo',
    '2025-08-06', -- Transfiguración del Señor
    'Pbro. [Nombre del Párroco]',
    'Salvador del Mundo', 
    'Parroquia ubicada en la Colonia Cerro Grande, proclamando a Jesús como Salvador del Mundo.',
    'Jesús, Salvador del Mundo, en ti confiamos',
    '{
        "domingo": ["07:30", "09:30", "17:00", "19:00"],
        "lunes_viernes": ["06:00", "17:30"],
        "sabado": ["17:30"]
    }',
    '{
        "sabado": ["15:30-17:00"],
        "domingo": ["08:30-09:15", "16:00-16:45"]
    }',
    '{
        "lunes_viernes": ["08:00-12:00", "14:00-17:00"],
        "sabado": ["08:00-11:00"]
    }',
    'Dada en la Parroquia Salvador del Mundo, Colonia Cerro Grande, Tegucigalpa, a solicitud del interesado.',
    'ARQUIDIÓCESIS DE TEGUCIGALPA\nPARROQUIA SALVADOR DEL MUNDO\nColonia Cerro Grande, Tegucigalpa, Francisco Morazán',
    '{
        "en_constancias": true,
        "en_reportes": true,
        "en_dashboard": true, 
        "en_header": false,
        "posicion_dashboard": "sidebar_top",
        "tamaño_dashboard": "small"
    }',
    'America/Tegucigalpa',
    'es'
);

-- Páginas del sistema
INSERT INTO pagina (nombre, descripcion, url, categoria, icono, orden_menu, is_menu_principal) VALUES
('Dashboard', 'Panel principal del sistema', '/dashboard', 'sistema', 'dashboard', 1, TRUE),
('Personas', 'Gestión de personas y feligreses', '/personas', 'personas', 'users', 2, TRUE),
('Bautismos', 'Registro de bautismos', '/sacramentos/bautismos', 'sacramentos', 'droplets', 3, TRUE),
('Confirmaciones', 'Registro de confirmaciones', '/sacramentos/confirmaciones', 'sacramentos', 'check-circle', 4, TRUE),
('Matrimonios', 'Registro de matrimonios', '/sacramentos/matrimonios', 'sacramentos', 'heart', 5, TRUE),
('Primera Comunión', 'Registro de primeras comuniones', '/sacramentos/primera-comunion', 'sacramentos', 'bread', 6, TRUE),
('Configuración General', 'Configuración general de la parroquia', '/configuracion/general', 'configuracion', 'settings', 7, TRUE),
('Sectores Parroquiales', 'Gestión de sectores y capillas', '/configuracion/sectores', 'configuracion', 'map', 8, TRUE),
('Permisos del Sistema', 'Configuración de roles y permisos', '/configuracion/permisos', 'configuracion', 'shield', 9, TRUE),
('Usuarios', 'Gestión de usuarios del sistema', '/usuarios', 'sistema', 'user-circle', 10, TRUE);

-- Roles parroquiales básicos
INSERT INTO rol_parroquial (nombre, descripcion, nivel_responsabilidad, permisos_especiales) VALUES
('Miembro', 'Miembro activo del grupo', 1, '{}'),
('Coordinador', 'Coordinador de actividades', 2, '{"puede_convocar": true, "puede_organizar": true}'),
('Líder', 'Líder o responsable principal', 3, '{"puede_convocar": true, "puede_organizar": true, "puede_representar": true}'),
('Secretario', 'Secretario del grupo', 2, '{"puede_documentar": true, "acceso_actas": true}'),
('Tesorero', 'Tesorero del grupo', 2, '{"manejo_fondos": true, "reportes_financieros": true}');

-- Usuarios administradores para ambas parroquias piloto
INSERT INTO usuario (
    id_parroquia, id_rol, nombre, email, contrasena, telefono, estado, id_usuario_creacion,
    preferencias_usuario
) VALUES 
-- Usuario admin para Cristo Resucitado
(1, 1, 'Administrador Cristo Resucitado', 'admin@cristoresucitado.hn', 
 decode('24326124313024454c48334c6358654751585764426e77786e4f31754f35784f6e6c3933596e526667722f3376653549327a4e784b4a5569', 'hex'), 
 '+504 2222-3333', 1, 1,
 '{"tema": "system", "idioma": "es", "parroquia": "Cristo Resucitado"}'),

-- Usuario admin para Salvador del Mundo  
(2, 1, 'Administrador Salvador del Mundo', 'admin@salvadormundo.hn',
 decode('24326124313024454c48334c6358654751585764426e77786e4f31754f35784f6e6c3933596e526667722f3376653549327a4e784b4a5569', 'hex'),
 '+504 2222-4444', 1, 1, 
 '{"tema": "system", "idioma": "es", "parroquia": "Salvador del Mundo"}');

-- PARROQUIAS PILOTO:
-- 1. Cristo Resucitado (Colonia Loarque) - Parroquia principal de pruebas
-- 2. Salvador del Mundo (Colonia Cerro Grande) - Parroquia secundaria para conectividad
-- Ambas pertenecen a la Arquidiócesis de Tegucigalpa, Honduras
-- 
-- CONECTIVIDAD FEDERADA:
-- - Cada parroquia puede consultar datos específicos de la otra (personas trasladadas, etc.)
-- - Sistema de notificaciones entre parroquias para eventos importantes
-- - Mantenimiento de BD independientes con consultas autorizadas
--
-- CÓDIGOS DE PARROQUIA:
-- CR-LOARQUE-001: Cristo Resucitado
-- SM-CERROGRANDE-002: Salvador del Mundo

COMMENT ON TABLE parroquia IS 'TABLA PRINCIPAL MULTI-TENANT: Identificación básica de parroquias para aislamiento de datos y conectividad entre BD federadas. Piloto: Arquidiócesis de Tegucigalpa.';
COMMENT ON TABLE parroquia_config IS 'CONFIGURACIÓN PARA DOCUMENTOS: Datos específicos para constancias, reportes, apariencia del sistema y configuración litúrgica.';
COMMENT ON COLUMN parroquia.codigo_parroquia IS 'Código único para identificación entre parroquias en sistema federado. Formato: [PATRON]-[COLONIA]-[NUM]';
COMMENT ON COLUMN parroquia.diocesis IS 'Arquidiócesis de Tegucigalpa para el piloto inicial del sistema.';
COMMENT ON COLUMN parroquia.parroquias_autorizadas IS 'Lista de códigos de parroquias autorizadas para consultas federadas.';
COMMENT ON COLUMN parroquia.endpoint_notificaciones IS 'URL para recibir notificaciones de otras parroquias del sistema federado.';
COMMENT ON COLUMN parroquia_config.alias_liturgico IS 'Nombre completo que aparece en constancias y documentos oficiales.';
COMMENT ON COLUMN parroquia_config.logo_parroquial_url IS 'Logo específico de la parroquia. NO reemplaza la identidad visual del sistema Christi Fideles.';
COMMENT ON COLUMN parroquia_config.mostrar_logo_parroquial IS 'Configuración de dónde y cómo mostrar el logo parroquial sin afectar la marca del sistema.';
COMMENT ON COLUMN parroquia_config.nombre_corto IS 'Nombre corto de la parroquia para mostrar junto al logo del sistema en el UI.';
COMMENT ON COLUMN parroquia_config.numeracion_config IS 'Configuración específica de numeración para cada tipo de sacramento.';
COMMENT ON TABLE parroquia_parametro IS 'Parámetros dinámicos y configurables por parroquia.';
COMMENT ON TABLE tr_rol_pagina IS 'Matriz de permisos granulares por rol y página.';
COMMENT ON TABLE sector_parroquial IS 'Sectores, capillas y divisiones territoriales de la parroquia.';
COMMENT ON TABLE numeradores IS 'Sistema de numeración configurable para diferentes módulos.';
COMMENT ON TABLE bitacora_crud IS 'Auditoría completa de todas las operaciones del sistema.';
COMMENT ON TABLE persona IS 'Tabla madre fundamental. TODOS los individuos deben registrarse aquí primero, incluyendo sacerdotes.';
COMMENT ON TABLE orden_sacerdotal IS 'Información específica de sacerdotes. Requiere registro previo en tabla persona.';
COMMENT ON CONSTRAINT orden_sacerdotal_id_parroquia_numero_identidad_fkey ON orden_sacerdotal IS 'CONSTRAINT FUNDAMENTAL: Todo sacerdote debe existir primero como persona.';
COMMENT ON TABLE grupo_parroquial IS 'Grupos, ministerios y movimientos de la parroquia.';
COMMENT ON TABLE tr_persona_grupo_rol IS 'Membresía de personas en grupos con roles específicos.';

-- ================================================================================
-- FIN DEL SCRIPT
-- ================================================================================