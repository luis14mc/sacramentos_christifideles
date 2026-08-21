# Sprint 7 — QA Integral / Staging Readiness

Fecha: 2026-08-21
Base: `master` después de Sprint 6
Rama: `feature/sprint7-staging-qa`

## Resumen ejecutivo
Sprint 7 prepara el repositorio para staging, reduce riesgo de conexiones Prisma en serverless y añade healthcheck, smoke test y runbooks. No se declara staging desplegado porque no se han proporcionado credenciales Vercel/Neon. Se detectó además un bloqueo real: el repositorio no contiene `prisma/migrations/`, por lo que `prisma migrate deploy` aún no puede considerarse un bootstrap reproducible.

## Estado Go / No-Go
**NO-GO para Release Candidate por ahora.**

Motivo P1: falta una estrategia/migración baseline formal y probada en base limpia antes de desplegar staging. Este reporte no sustituye esa validación por `prisma db push`.

## Hallazgos
### P0
- Ninguno identificado en revisión de código de este sprint.

### P1
- **Migraciones formales ausentes:** no existe `prisma/migrations/`. Debe resolverse antes de declarar staging/release reproducible.
- **Staging externo no ejecutado:** falta configurar recursos/credenciales Vercel + Neon separados y ejecutar QA contra ellos.

### P2
- Rate limiting de login/búsqueda/PDF sigue diferido según Sprint 6; no bloquea staging inicial si el entorno es restringido.

## Cambios de readiness
- Rutas de catálogos/configuración migradas del patrón `new PrismaClient()` al singleton `@/lib/prisma`.
- `GET /api/health` con query mínima a PostgreSQL, sin exponer infraestructura sensible.
- `scripts/smoke-test.mjs` valida health y que un endpoint protegido rechace una llamada anónima.
- `.env.example` separa conceptos local/staging y mantiene placeholders.
- Runbook de backup/restore añadido.
- Guía de deployment staging añadida.

## Matriz QA
| Área | Prueba | Resultado | Evidencia |
|---|---|---|---|
| Prisma | Singleton en route handlers pendientes | PASS | Diff Sprint 7 |
| Health | Query `SELECT 1` y respuesta segura | PENDING CI | `tests/health.test.ts` |
| Regresión | Suite completa Vitest | PENDING CI | GitHub Actions del PR |
| Prisma schema | `prisma generate` / `validate` | PENDING CI | GitHub Actions del PR |
| Lint | ESLint | PENDING CI | GitHub Actions del PR |
| Build | Next production build | PENDING CI | GitHub Actions del PR |
| Multi-tenant | Regresión automatizada existente | PENDING CI | Suites Personas/Sacramentos/Libros/PDF/Auditoría/Búsqueda/Dashboard |
| RBAC | Regresión automatizada existente | PENDING CI | suites vigentes |
| Numeradores | Concurrencia / separación tenant | PENDING CI | `tests/numeradores.test.ts` |
| PDF | tenant / fallback / content-type | PENDING CI | `tests/constancias.test.ts` |
| Auditoría | filtros / tenant / permisos | PENDING CI | `tests/auditoria.test.ts` |
| Búsqueda | DNI/nombre/fecha/libro/registro/tenant | PENDING CI | `tests/busqueda.test.ts` |
| Migraciones | `prisma migrate deploy` en DB limpia | FAIL/PENDING | `prisma/migrations/` ausente |
| Neon staging | DB separada | PENDING | requiere credenciales externas |
| Vercel staging | Deploy real | PENDING | requiere acceso/configuración externa |
| Backup | procedimiento documentado | PASS | `docs/BACKUP_RESTORE_RUNBOOK.md` |
| Restore | ejecución real de pg_dump/pg_restore | PENDING | requiere DB staging/herramientas |
| Smoke remoto | `/api/health` + endpoint protegido | PENDING | ejecutar `BASE_URL=... npm run smoke` tras deploy |

## Criterios para cambiar a GO
1. Crear/revisar migración baseline formal sin destruir el modelo v1.
2. Ejecutar `prisma migrate deploy` sobre PostgreSQL vacío y demostrar instalación limpia.
3. Configurar Neon staging separada.
4. Desplegar Vercel staging con secretos propios.
5. Ejecutar regresión, smoke, multi-tenant y RBAC sobre staging.
6. Ejecutar al menos una prueba real de backup/restore o registrarla como riesgo aceptado explícitamente por Product Owner antes del piloto.
7. Cero P0/P1 abiertos.

## Restricciones respetadas
- Sin Defunciones.
- Sin nuevas features de negocio.
- Sin production.
- Sin `prisma db push` como sustituto de staging migrations.
- Sin secretos reales en Git.
