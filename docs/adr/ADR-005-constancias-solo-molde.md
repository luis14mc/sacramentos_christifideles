# ADR-005 — Constancias solo por molde PDF

- **Estado:** Aceptada · **Fecha:** 2026-10-01 · **Decide:** PO

## Contexto
Existían dos vías: plantillas de texto (`plantilla_constancia`) y moldes PDF. Las parroquias ya tienen su papelería membretada.

## Decisión
- La única vía configurable es el **molde PDF** (`molde_constancia`), uno activo por parroquia, sacramento y tipo:
  - PDF **con campos** (AcroForm) → cada campo se mapea a un token y se rellena.
  - PDF **sin campos** (hoja membretada) → se escribe el texto sobre la hoja desde `margen_superior`, con los datos del libro y la firma del párroco.
- Sin molde activo → constancia simple con el logo de la parroquia.
- Los datos salen siempre de la base; el cliente solo indica el sacramento, el id y el tipo.
- `plantilla_constancia` queda sin UI y se conserva por datos existentes.

## Consecuencias
- ✅ Constancias con la papelería oficial de cada parroquia.
- ⚠️ Cada parroquia debe subir y probar su molde antes de emitir constancias reales.
