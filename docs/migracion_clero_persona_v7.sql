-- Migración v7: orden_sacerdotal como extensión clerical de persona
-- Ejecutar en Neon/Postgres antes de desplegar el refactor de Clero

BEGIN;

-- 1. Eliminar columnas personales duplicadas (si existen)
ALTER TABLE orden_sacerdotal DROP COLUMN IF EXISTS nombres;
ALTER TABLE orden_sacerdotal DROP COLUMN IF EXISTS apellidos;
ALTER TABLE orden_sacerdotal DROP COLUMN IF EXISTS fecha_nacimiento;
ALTER TABLE orden_sacerdotal DROP COLUMN IF EXISTS lugar_nacimiento;
ALTER TABLE orden_sacerdotal DROP COLUMN IF EXISTS telefono;
ALTER TABLE orden_sacerdotal DROP COLUMN IF EXISTS email;

-- 2. Asegurar FK hacia persona (id_parroquia + numero_identidad)
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

-- 3. Cambiar PK a compuesta si aún usa solo numero_identidad
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

-- 4. Actualizar FK de sacramentos hacia orden_sacerdotal compuesta
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

-- 5. Rangos ministeriales canónicos
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
