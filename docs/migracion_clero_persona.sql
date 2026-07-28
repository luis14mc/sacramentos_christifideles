-- Migración: orden_sacerdotal como extensión clerical de persona
-- Archivo: docs/migracion_clero_persona.sql
-- Ejecutar en Postgres/Neon antes de desplegar el refactor de Clero

BEGIN;

-- 1. Migrar datos personales huérfanos hacia persona (si aún existen columnas duplicadas)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orden_sacerdotal' AND column_name = 'nombres'
  ) THEN
    INSERT INTO persona (
      numero_identidad, id_parroquia, id_sector_parroquial, id_orden_religiosa,
      nombres, apellidos, fecha_nacimiento, lugar_nacimiento, sexo, telefono, email,
      estado_vital, estado_activo_parroquia
    )
    SELECT
      os.numero_identidad,
      os.id_parroquia,
      COALESCE(
        (SELECT MIN(id_sector_parroquial) FROM sector_parroquial sp WHERE sp.id_parroquia = os.id_parroquia),
        1
      ),
      COALESCE(os.id_orden_religiosa, 1),
      os.nombres,
      os.apellidos,
      COALESCE(os.fecha_nacimiento, CURRENT_DATE),
      COALESCE(os.lugar_nacimiento, '0801'),
      'M',
      COALESCE(os.telefono, '0000000000'),
      os.email,
      1,
      1
    FROM orden_sacerdotal os
    WHERE NOT EXISTS (
      SELECT 1 FROM persona p
      WHERE p.id_parroquia = os.id_parroquia
        AND p.numero_identidad = os.numero_identidad
    );
  END IF;
END $$;

-- 2. Renombrar estado clerical si aplica
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orden_sacerdotal' AND column_name = 'estado_vital'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orden_sacerdotal' AND column_name = 'estado_ministerial'
  ) THEN
    ALTER TABLE orden_sacerdotal RENAME COLUMN estado_vital TO estado_ministerial;
  END IF;
END $$;

-- 3. Eliminar columnas personales duplicadas
ALTER TABLE orden_sacerdotal DROP COLUMN IF EXISTS nombres;
ALTER TABLE orden_sacerdotal DROP COLUMN IF EXISTS apellidos;
ALTER TABLE orden_sacerdotal DROP COLUMN IF EXISTS fecha_nacimiento;
ALTER TABLE orden_sacerdotal DROP COLUMN IF EXISTS lugar_nacimiento;
ALTER TABLE orden_sacerdotal DROP COLUMN IF EXISTS telefono;
ALTER TABLE orden_sacerdotal DROP COLUMN IF EXISTS email;

-- 4. Hacer opcional la orden religiosa clerical
ALTER TABLE orden_sacerdotal ALTER COLUMN id_orden_religiosa DROP NOT NULL;

-- 5. FK compuesta hacia persona
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orden_sacerdotal_id_parroquia_numero_identidad_fkey'
  ) THEN
    ALTER TABLE orden_sacerdotal
      ADD CONSTRAINT orden_sacerdotal_id_parroquia_numero_identidad_fkey
      FOREIGN KEY (id_parroquia, numero_identidad)
      REFERENCES persona(id_parroquia, numero_identidad)
      ON UPDATE RESTRICT
      ON DELETE RESTRICT;
  END IF;
END $$;

-- 6. Primary key compuesta
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'orden_sacerdotal'::regclass
      AND contype = 'p'
      AND array_length(conkey, 1) = 1
  ) THEN
    ALTER TABLE orden_sacerdotal DROP CONSTRAINT IF EXISTS orden_sacerdotal_pkey;
    ALTER TABLE orden_sacerdotal ADD PRIMARY KEY (id_parroquia, numero_identidad);
  END IF;
END $$;

-- 7. FK de sacramentos hacia orden_sacerdotal compuesta
ALTER TABLE bautismo DROP CONSTRAINT IF EXISTS bautismo_numero_identidad_sacerdote_fkey;
ALTER TABLE bautismo
  ADD CONSTRAINT bautismo_numero_identidad_sacerdote_fkey
  FOREIGN KEY (id_parroquia, numero_identidad_sacerdote)
  REFERENCES orden_sacerdotal(id_parroquia, numero_identidad)
  ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE primera_comunion DROP CONSTRAINT IF EXISTS primera_comunion_numero_identidad_sacerdote_fkey;
ALTER TABLE primera_comunion
  ADD CONSTRAINT primera_comunion_numero_identidad_sacerdote_fkey
  FOREIGN KEY (id_parroquia, numero_identidad_sacerdote)
  REFERENCES orden_sacerdotal(id_parroquia, numero_identidad)
  ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE confirmacion DROP CONSTRAINT IF EXISTS confirmacion_numero_identidad_obispo_fkey;
ALTER TABLE confirmacion
  ADD CONSTRAINT confirmacion_numero_identidad_obispo_fkey
  FOREIGN KEY (id_parroquia, numero_identidad_obispo)
  REFERENCES orden_sacerdotal(id_parroquia, numero_identidad)
  ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE matrimonio DROP CONSTRAINT IF EXISTS matrimonio_numero_identidad_sacerdote_fkey;
ALTER TABLE matrimonio
  ADD CONSTRAINT matrimonio_numero_identidad_sacerdote_fkey
  FOREIGN KEY (id_parroquia, numero_identidad_sacerdote)
  REFERENCES orden_sacerdotal(id_parroquia, numero_identidad)
  ON UPDATE RESTRICT ON DELETE RESTRICT;

-- 8. Rangos ministeriales canónicos
INSERT INTO rango_orden_sacerdotal (nombre, descripcion)
SELECT v.nombre, v.descripcion
FROM (VALUES
  ('Diácono', 'Diácono permanente o transitorio'),
  ('Presbítero', 'Sacerdote con orden presbiteral'),
  ('Sacerdote', 'Sacerdote presbítero'),
  ('Obispo', 'Obispo diocesano o auxiliar')
) AS v(nombre, descripcion)
WHERE NOT EXISTS (
  SELECT 1 FROM rango_orden_sacerdotal r WHERE r.nombre = v.nombre
);

COMMIT;
