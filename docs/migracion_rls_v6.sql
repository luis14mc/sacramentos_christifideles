-- ============================================================================
-- CHRISTI FIDELES - Row Level Security (RLS) v6
-- Ejecutar en PostgreSQL/Neon DESPUÉS de migraciones Prisma.
-- Activar en app: DATABASE_RLS_ENABLED=true
-- ============================================================================

BEGIN;

-- Helper: tenant activo en sesión (NULL = sin filtro, p.ej. login)
CREATE OR REPLACE FUNCTION app_current_tenant_id() RETURNS INT AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::INT;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION app_tenant_matches(parish_id INT) RETURNS BOOLEAN AS $$
  SELECT app_current_tenant_id() IS NULL OR parish_id = app_current_tenant_id();
$$ LANGUAGE SQL STABLE;

-- Macro: políticas estándar por tabla con id_parroquia
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'persona',
    'bautismo',
    'primera_comunion',
    'confirmacion',
    'matrimonio',
    'bitacora_crud',
    'sector_parroquial',
    'orden_sacerdotal',
    'plantilla_constancia',
    'numeradores',
    'parroquia_parametro'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_select ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_insert ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_update ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_delete ON %I', t, t);

    EXECUTE format(
      'CREATE POLICY %I_tenant_select ON %I FOR SELECT USING (app_tenant_matches(id_parroquia))',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY %I_tenant_insert ON %I FOR INSERT WITH CHECK (app_tenant_matches(id_parroquia))',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY %I_tenant_update ON %I FOR UPDATE USING (app_tenant_matches(id_parroquia)) WITH CHECK (app_tenant_matches(id_parroquia))',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY %I_tenant_delete ON %I FOR DELETE USING (app_tenant_matches(id_parroquia))',
      t, t
    );
  END LOOP;
END $$;

-- Usuario: permite SELECT sin tenant (login por email global)
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS usuario_tenant_select ON usuario;
DROP POLICY IF EXISTS usuario_tenant_insert ON usuario;
DROP POLICY IF EXISTS usuario_tenant_update ON usuario;
DROP POLICY IF EXISTS usuario_tenant_delete ON usuario;

CREATE POLICY usuario_tenant_select ON usuario
  FOR SELECT USING (app_tenant_matches(id_parroquia));

CREATE POLICY usuario_tenant_insert ON usuario
  FOR INSERT WITH CHECK (app_tenant_matches(id_parroquia));

CREATE POLICY usuario_tenant_update ON usuario
  FOR UPDATE USING (app_tenant_matches(id_parroquia))
  WITH CHECK (app_tenant_matches(id_parroquia));

CREATE POLICY usuario_tenant_delete ON usuario
  FOR DELETE USING (app_tenant_matches(id_parroquia));

-- Parroquia: solo la propia
ALTER TABLE parroquia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS parroquia_tenant_select ON parroquia;
DROP POLICY IF EXISTS parroquia_tenant_update ON parroquia;

CREATE POLICY parroquia_tenant_select ON parroquia
  FOR SELECT USING (app_tenant_matches(id_parroquia));

CREATE POLICY parroquia_tenant_update ON parroquia
  FOR UPDATE USING (app_tenant_matches(id_parroquia))
  WITH CHECK (app_tenant_matches(id_parroquia));

-- Instalación inicial (sin tenant en sesión)
CREATE POLICY parroquia_setup_insert ON parroquia
  FOR INSERT WITH CHECK (app_current_tenant_id() IS NULL);

-- Config parroquia
ALTER TABLE parroquia_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS parroquia_config_tenant ON parroquia_config;

CREATE POLICY parroquia_config_tenant ON parroquia_config
  FOR ALL USING (app_tenant_matches(id_parroquia))
  WITH CHECK (app_tenant_matches(id_parroquia));

COMMIT;

-- Uso desde la app (Prisma withTenantScope):
--   SELECT set_config('app.tenant_id', '2', true);
--   SELECT * FROM persona;  -- solo parroquia 2
