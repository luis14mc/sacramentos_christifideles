-- Migración: orden_sacerdotal como extensión de Persona.
-- No inventa Personas. Aborta si hay clero huérfano.
-- Revisar el resultado de huérfanos ANTES de ejecutar en un entorno con datos.
--
-- No usar prisma db push. Aplicar este SQL de forma revisada sobre el entorno
-- de desarrollo. No ejecutar contra producción sin backup y visto bueno.

BEGIN;

DO $$
DECLARE
  huerfanos INTEGER;
BEGIN
  SELECT COUNT(*) INTO huerfanos
  FROM orden_sacerdotal os
  LEFT JOIN persona pe
    ON pe.id_parroquia = os.id_parroquia
   AND pe.numero_identidad = os.numero_identidad
  WHERE pe.numero_identidad IS NULL;

  IF huerfanos > 0 THEN
    RAISE EXCEPTION
      'Hay % registros en orden_sacerdotal sin Persona (id_parroquia, numero_identidad). No se inventan Personas. Resolver antes de migrar.',
      huerfanos;
  END IF;
END $$;

ALTER TABLE orden_sacerdotal
  ADD COLUMN IF NOT EXISTS estado_ministerial SMALLINT;

UPDATE orden_sacerdotal
   SET estado_ministerial = CASE WHEN estado_vital = 1 THEN 1 ELSE 0 END
 WHERE estado_ministerial IS NULL;

ALTER TABLE orden_sacerdotal
  ALTER COLUMN estado_ministerial SET DEFAULT 1,
  ALTER COLUMN estado_ministerial SET NOT NULL;

ALTER TABLE orden_sacerdotal
  DROP CONSTRAINT IF EXISTS orden_sacerdotal_estado_ministerial_check;

ALTER TABLE orden_sacerdotal
  ADD CONSTRAINT orden_sacerdotal_estado_ministerial_check
  CHECK (estado_ministerial IN (0, 1));

ALTER TABLE orden_sacerdotal
  DROP CONSTRAINT IF EXISTS orden_sacerdotal_es_parroco_check;

ALTER TABLE orden_sacerdotal
  ADD CONSTRAINT orden_sacerdotal_es_parroco_check
  CHECK (es_parroco IN (0, 1));

ALTER TABLE orden_sacerdotal
  DROP CONSTRAINT IF EXISTS orden_sacerdotal_persona_fk;

ALTER TABLE orden_sacerdotal
  ADD CONSTRAINT orden_sacerdotal_persona_fk
  FOREIGN KEY (id_parroquia, numero_identidad)
  REFERENCES persona(id_parroquia, numero_identidad)
  ON DELETE RESTRICT
  ON UPDATE RESTRICT;

-- Las FKs sacramentales pueden apuntar a la PK global antigua (numero_identidad)
-- o al UNIQUE compuesto. Se recrean contra la nueva PK compuesta.
ALTER TABLE bautismo DROP CONSTRAINT IF EXISTS bautismo_id_parroquia_numero_identidad_sacerdote_fkey;
ALTER TABLE bautismo DROP CONSTRAINT IF EXISTS bautismo_numero_identidad_sacerdote_fkey;
ALTER TABLE primera_comunion DROP CONSTRAINT IF EXISTS primera_comunion_id_parroquia_numero_identidad_sacerdote_fkey;
ALTER TABLE primera_comunion DROP CONSTRAINT IF EXISTS primera_comunion_numero_identidad_sacerdote_fkey;
ALTER TABLE confirmacion DROP CONSTRAINT IF EXISTS confirmacion_id_parroquia_numero_identidad_obispo_fkey;
ALTER TABLE confirmacion DROP CONSTRAINT IF EXISTS confirmacion_numero_identidad_obispo_fkey;
ALTER TABLE matrimonio DROP CONSTRAINT IF EXISTS matrimonio_id_parroquia_numero_identidad_sacerdote_fkey;
ALTER TABLE matrimonio DROP CONSTRAINT IF EXISTS matrimonio_numero_identidad_sacerdote_fkey;

ALTER TABLE orden_sacerdotal DROP CONSTRAINT IF EXISTS orden_sacerdotal_pkey;
ALTER TABLE orden_sacerdotal DROP CONSTRAINT IF EXISTS orden_sacerdotal_id_parroquia_numero_identidad_key;
ALTER TABLE orden_sacerdotal ADD PRIMARY KEY (id_parroquia, numero_identidad);

ALTER TABLE bautismo
  ADD CONSTRAINT bautismo_id_parroquia_numero_identidad_sacerdote_fkey
  FOREIGN KEY (id_parroquia, numero_identidad_sacerdote)
  REFERENCES orden_sacerdotal(id_parroquia, numero_identidad);

ALTER TABLE primera_comunion
  ADD CONSTRAINT primera_comunion_id_parroquia_numero_identidad_sacerdote_fkey
  FOREIGN KEY (id_parroquia, numero_identidad_sacerdote)
  REFERENCES orden_sacerdotal(id_parroquia, numero_identidad);

ALTER TABLE confirmacion
  ADD CONSTRAINT confirmacion_id_parroquia_numero_identidad_obispo_fkey
  FOREIGN KEY (id_parroquia, numero_identidad_obispo)
  REFERENCES orden_sacerdotal(id_parroquia, numero_identidad);

ALTER TABLE matrimonio
  ADD CONSTRAINT matrimonio_id_parroquia_numero_identidad_sacerdote_fkey
  FOREIGN KEY (id_parroquia, numero_identidad_sacerdote)
  REFERENCES orden_sacerdotal(id_parroquia, numero_identidad);

ALTER TABLE orden_sacerdotal
  DROP COLUMN IF EXISTS nombres,
  DROP COLUMN IF EXISTS apellidos,
  DROP COLUMN IF EXISTS fecha_nacimiento,
  DROP COLUMN IF EXISTS lugar_nacimiento,
  DROP COLUMN IF EXISTS telefono,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS otra_orden_religiosa,
  DROP COLUMN IF EXISTS estado_vital,
  DROP COLUMN IF EXISTS imagen;

COMMIT;
