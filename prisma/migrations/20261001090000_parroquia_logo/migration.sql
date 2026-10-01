-- Logo de la parroquia guardado en la BD (sin almacenamiento externo en v1).
-- Lo usan las constancias generadas sin molde membretado.
ALTER TABLE "parroquia_config" ADD COLUMN     "logo_archivo" BYTEA,
ADD COLUMN     "logo_mime" VARCHAR(50);

