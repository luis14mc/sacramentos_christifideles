-- Moldes de constancia: además de PDF con campos, se admite hoja membretada
-- (PDF sin campos) sobre la que se escribe el texto de la constancia.
ALTER TABLE "molde_constancia" ADD COLUMN     "con_campos" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "contenido" TEXT,
ADD COLUMN     "margen_superior" SMALLINT NOT NULL DEFAULT 170;


ALTER TABLE "molde_constancia"
  ADD CONSTRAINT "molde_constancia_margen_superior_chk" CHECK ("margen_superior" BETWEEN 0 AND 600);
