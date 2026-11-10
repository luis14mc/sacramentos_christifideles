# ADR-002 — Una instancia y una base de datos por parroquia

- **Estado:** Aceptada · **Fecha:** 2026-09-24 · **Decide:** PO

## Contexto
El esquema nació multi-tenant (columna `id_parroquia` y RLS). Las parroquias piden que nadie más pueda ver sus libros, y cada una tiene su dominio.

## Decisión
Cada parroquia corre **su propia instancia** de la app (rama `master`) con **su propia base PostgreSQL** en Railway. La identidad de la instancia se fija por variables (`PARROQUIA_CODIGO`, `PARROQUIA_NOMBRE`…). Se conserva `id_parroquia` en el esquema como defensa adicional.

## Consecuencias
- ✅ Aislamiento físico: un error de código no puede mezclar parroquias.
- ✅ Respaldo y restauración independientes.
- ⚠️ Costo y operación crecen por parroquia (un servicio + una base cada una).
- ⚠️ Las migraciones se aplican en cada instancia (automático en el arranque).
- Compartir datos entre parroquias requiere el centralizador (ADR-003, ADR-004).
