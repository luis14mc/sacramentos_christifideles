# Plan de acción v1 — post auditoría de seguridad

Fecha: 2026-09-22
Base: `docs/security-audit/run-2026-09-22/`, `ROADMAP_V1.md`, `PROJECT_CONTEXT.md`, `AGENTS.md`
Rama de trabajo actual: `fix/security-hardening` (PR abierto)

---

## 1. Evaluación de avance del sistema

Medición por **flujos parroquiales completos** (métrica oficial del roadmap), no por commits.

### 1.1 Funcionalidad core (alcance v1)

| Área | Avance | Estado |
|------|:------:|--------|
| Autenticación y sesión | 90% | Login + JWT + revocación/throttle (nuevo). Falta rate limit prod. |
| Roles y permisos | 90% | Matriz completa + alias de rol. Afinar lecturas auxiliares. |
| Aislamiento multi-parroquia | 85% | Core sólido; falta E2E cross-tenant y catálogos globales. |
| Usuarios (CRUD) | 95% | Completo con auditoría y scope compuesto. |
| Personas (CRUD, DNI obligatorio) | 90% | PK compuesta correcta; falta pulir dedupe aproximado. |
| Bautismos | 95% | Flujo E2E funcional. |
| Primera comunión | 95% | Funcional. |
| Confirmación | 95% | Funcional. |
| Matrimonio | 90% | Funcional; validar relaciones a fondo. |
| Defunciones / funerario | 0% | No implementado (candidato v1.1 según roadmap). |
| Libros / folios / numeración | 85% | Numeradores por módulo; falta test de concurrencia. |
| Constancias PDF | 90% | Generación + plantillas por parroquia + permiso corregido. |
| Auditoría | 85% | Bitácora conectada a escrituras clave; ampliar cobertura. |
| Búsqueda global | 90% | Por nombre/DNI/sacramento. |
| Dashboard | 85% | Datos reales por parroquia. |
| Configuración parroquial mínima | 80% | Catálogos + constancias; endurecer authz (hecho parcialmente). |

**Subtotal core: ~90%**

### 1.2 Preparación para producción (release-readiness)

| Área | Avance | Estado |
|------|:------:|--------|
| Migraciones Prisma reproducibles | 60% | Baseline creada + CI `migrate deploy`. Falta validar en Neon / `migrate resolve` si hay datos. |
| CI (lint/test/build) | 90% | Pipeline con Postgres operativo. |
| Hardening de seguridad | 75% | Headers + JWT + authz hechos. Falta CSP estricta y rate limit. |
| Tests automatizados | 70% | Buena suite unit/integración; faltan E2E y concurrencia. |
| Staging (Vercel + Neon aislado) | 20% | No confirmado en repo. |
| Producción (Vercel + Neon) | 15% | Pendiente. |
| Backups y restore probados | 10% | Pendiente. |
| Observabilidad / monitoreo / logs | 10% | Pendiente. |
| Runbook incidentes / rollback | 5% | Pendiente. |

**Subtotal producción: ~40%**

### 1.3 Veredicto global

> **Avance global v1: ~75%**
> - **Producto/funcionalidad: ~90%** — el flujo crítico (persona → sacramento → numeración → consulta → constancia → auditoría) está esencialmente construido.
> - **Preparación para producción: ~40%** — es el verdadero cuello de botella para el piloto del 19/oct: despliegue, migraciones validadas, backups, monitoreo y QA integral.

La brecha no es "construir features", es **estabilizar, validar y desplegar**.

---

## 2. Estado de hallazgos de la auditoría

| Hallazgo | Severidad | Estado |
|----------|-----------|--------|
| POST catálogos sin authz | Alta | ✅ Corregido |
| JWT sin revalidación de rol/estado | Alta | ✅ Corregido (throttle 60s + revocación) |
| Middleware con rutas sin proteger | Media | ✅ Corregido |
| Constancia PDF con permiso incorrecto | Media | ✅ Corregido |
| Lecturas de catálogo sin permiso | Media | ✅ Corregido (GET config) |
| Scope compuesto en update/delete | Media | ✅ Corregido |
| Cabeceras de seguridad ausentes | Media | ✅ Añadidas (falta CSP) |
| Rate limiting de login | Baja-Media | ⏳ Pendiente (validar en plataforma) |

---

## 3. Plan de acción priorizado

### P0 — Bloquea release (hacer primero)

1. **Validar migración baseline en Neon**
   - Aplicar `prisma migrate deploy` en base de staging vacía; si producción/Neon ya tiene datos, `prisma migrate resolve --applied <migración_init>`.
   - Criterio: base reproducible desde cero; `migrate status` limpio.
2. **Cerrar merge del PR `fix/security-hardening`** tras CI verde.
   - Criterio: lint + tests + build + migrate deploy en verde.
3. **QA de aislamiento multi-tenant (A vs B)**
   - Pruebas: usuario A no lee/escribe datos de B en cada módulo sacramental + usuarios + constancias.
   - Criterio: 0 fugas; documentado.
4. **Prueba de concurrencia de numeradores**
   - Simular altas simultáneas por módulo/parroquia; verificar no colisión de libro/folio/registro.

### P1 — Antes del piloto

5. **Staging en Vercel + Neon aislado** con variables seguras y `NEXTAUTH_SECRET` propio.
6. **Backups y restore probados** en Neon (snapshot + restauración verificada).
7. **Suite E2E manual** del caso de uso crítico (10 pasos de `PROJECT_CONTEXT.md`).
8. **Rate limiting de login** (middleware/WAF o Vercel) + verificación.
9. **Observabilidad mínima**: logs estructurados sin datos sensibles + healthcheck monitorizado.
10. **Ampliar auditoría** a toda operación sacramental de escritura y revisar retención.
11. **Decisión de Defunciones**: confirmar si entra en v1 o se difiere a v1.1 (Scrum Master).

### P2 — v1.1 / mejoras

12. **CSP estricta** con nonces.
13. **Piloto RSC** en un listado para reducir waterfalls cliente.
14. **Accesibilidad**: `aria-label` en botones-icono, labels en formularios largos (WCAG 2.2 AA).
15. **Limpieza de seeds alternativos** (`seed-simple/clean/catalogs`) si no se usan.
16. **Alinear `eslint-config-next` con Next 16**.

---

## 4. Mapeo a sprints restantes del roadmap

| Sprint | Ventana | Foco con este plan |
|--------|---------|--------------------|
| 6 (hardening) | 28 sep–4 oct | P0.2–P0.4, P1.8–P1.10 |
| 7 (staging/QA) | 5–11 oct | P0.1, P1.5–P1.7, P1.11 |
| 8 (release) | 12–19 oct | Backups, monitoreo, runbook, smoke productivo, piloto |

---

## 5. Definition of Release Ready (checklist)

- [ ] build y lint verdes
- [ ] migraciones reproducibles y validadas en Neon
- [ ] login/roles/multi-tenant validados por QA
- [ ] Personas y sacramentos comprometidos funcionando
- [ ] numeración sin colisiones (probado en concurrencia)
- [ ] constancias generables
- [ ] auditoría activa en cambios críticos
- [ ] backup y restore probados
- [ ] staging aceptado
- [ ] 0 P0 y 0 P1 de seguridad/integridad
