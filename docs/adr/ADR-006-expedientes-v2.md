# ADR-006 — El gestor de expedientes escaneados pasa a v2

- **Estado:** Aceptada · **Fecha:** 2026-09-24 · **Decide:** PO

## Contexto
Se planteó guardar escaneos (actas, partidas, documentos de identidad) por persona (Fase 3 del plan multiparroquia).

## Decisión
La v1 es el **registro sacramental**. El gestor de expedientes con escaneos se difiere a la v2. El "expediente" de la v1 es la vista agregada de los sacramentos de una persona (`/personas/[id]/expediente`).

## Consecuencias
- ✅ Alcance de v1 acotado para el piloto.
- ⚠️ Guardar archivos exigirá definir almacenamiento (BYTEA vs. objeto externo), tamaño, respaldos y privacidad. Ver `archivo/STORAGE_AUDIT.md`.
