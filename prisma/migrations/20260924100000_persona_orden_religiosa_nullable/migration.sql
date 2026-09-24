-- Orden religiosa opcional para Persona.
-- Solo los clerigos (registro en orden_sacerdotal) deben pertenecer a una
-- orden religiosa. Un fiel laico no requiere este dato, asi que la columna
-- pasa de NOT NULL a NULL en persona.
ALTER TABLE "persona"
  ALTER COLUMN "id_orden_religiosa" DROP NOT NULL;