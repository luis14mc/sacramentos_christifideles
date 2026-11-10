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

## Evidencia automática
GitHub Actions `ChristiFideles CI` run **#26** ejecutado sobre el PR #15 pasó completamente:
- instalación de dependencias: PASS;
- Prisma generate: PASS;
- Prisma validate: PASS;
- aplicación del schema a DB CI: PASS;
- lint: PASS;
- tests/regresión: PASS;
- production build: PASS.

## Matriz QA
| Área | Prueba | Resultado | Evidencia |
|---|---|---|---|
| Prisma | Singleton en route handlers pendientes | PASS | Diff Sprint 7 |
| Health | Query `SELECT 1` y respuesta segura | PASS | `tests/health.test.ts`, CI #26 |
| Regresión | Suite completa Vitest | PASS | GitHub Actions CI #26 |
| Prisma schema | `prisma generate` / `validate` | PASS | GitHub Actions CI #26 |
| Lint | ESLint | PASS | GitHub Actions CI #26 |
| Build | Next production build | PASS | GitHub Actions CI #26 |
| Multi-tenant | Regresión automatizada existente | PASS | suites Personas/Sacramentos/Libros/PDF/Auditoría/Búsqueda/Dashboard, CI #26 |
| RBAC | Regresión automatizada existente | PASS | suites vigentes, CI #26 |
| Numeradores | Concurrencia / separación tenant | PASS | `tests/numeradores.test.ts`, CI #26 |
| PDF | tenant / fallback / content-type | PASS | `tests/constancias.test.ts`, CI #26 |
| Auditoría | filtros / tenant / permisos | PASS | `tests/auditoria.test.ts`, CI #26 |
| Búsqueda | DNI/nombre/fecha/libro/registro/tenant | PASS | `tests/busqueda.test.ts`, CI #26 |
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
