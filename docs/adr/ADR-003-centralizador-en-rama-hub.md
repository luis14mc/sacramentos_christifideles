# ADR-003 — El centralizador vive en la rama permanente `hub`

- **Estado:** Aceptada · **Fecha:** 2026-10-05 · **Decide:** PO

## Contexto
El centralizador (hub) es otra aplicación, con su propio despliegue. Mantenerlo dentro de `master` mezclaba builds y dependencias.

## Decisión
- `hub` es una rama permanente; el servicio del hub en Railway despliega esa rama.
- `master` no contiene `hub/`.
- Los archivos compartidos (`src/lib/interop/firma.ts`, `src/lib/interop/contrato.ts`) se sincronizan en `hub` con `git checkout origin/master -- <archivos>`. **Nunca** `git merge master` dentro de `hub`.
- Cambios del hub: ramas `feature/hub-*` desde `hub`.

## Consecuencias
- ✅ Despliegues independientes.
- ⚠️ Riesgo de que el contrato se desincronice: todo cambio a `contrato.ts` o `firma.ts` debe llevarse a `hub` en el mismo ciclo y probarse de punta a punta.
