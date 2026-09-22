# Informe de auditoría de seguridad — ChristiFideles

| Campo | Valor |
|-------|--------|
| Repositorio | `luis14mc/sacramentos_christifideles` |
| Commit revisado | `7b17d35` (master, working tree con cambios locales menores) |
| Perfil | `standard` (modo full audit, fuente local) |
| Skill | [Cloudflare security-audit](https://github.com/cloudflare/security-audit-skill) |
| Fecha | 2026-09-22 |

## Resumen ejecutivo

Se auditó el código fuente de ChristiFideles (Next.js + NextAuth JWT + Prisma/PostgreSQL) con foco en autenticación, autorización por rol, aislamiento por `id_parroquia` y superficie HTTP/API.

**Hallazgos confirmados:** 4 (2 altos, 2 medios).  
**Pendientes de validación en despliegue:** 2 (cabeceras HTTP, rate limiting de login).

La base del producto es sólida en módulos sacramentales y personas (sesión + `hasPermission` + filtro de parroquia). Los problemas más urgentes son **autorización inconsistente en catálogos de configuración**, **JWT sin revalidación de rol/estado**, y **middleware de UI incompleto**.

## Tabla de hallazgos confirmados

| Severidad | Ubicación | Hallazgo |
|-----------|-----------|----------|
| **Alta** | `src/app/api/configuracion/grupos/route.ts:22`, `configuracion/roles/route.ts:22` | POST sin `hasPermission`: cualquier usuario autenticado puede crear catálogos globales. |
| **Alta** | `src/lib/auth.ts:91-105` | JWT fija rol/parroquia al login; revocación o cambio de rol no surte efecto hasta expirar sesión. |
| **Media** | `src/middleware.ts:20-33` | Rutas `/auditoria`, `/buscar`, `/libros`, `/primeras-comuniones` fuera del matcher; typo `primera-comunion`. |
| **Media** | `src/app/api/constancias/[sacramento]/[id]/route.ts:23` | PDF usa `canViewSacramentos` en vez de `canGenerateConstancias` (p. ej. catequista). |

## Fortalezas observadas

- APIs principales de sacramentos, personas, usuarios y auditoría combinan sesión, permisos y `id_parroquia` de sesión.
- Escalación a Super Admin restringida en `usuarios/route.ts`.
- `/api/setup` deshabilitado por defecto (`ALLOW_INITIAL_SETUP=false` en `.env.example`).
- No hay rutas `/api/debug` en el árbol actual; healthcheck acotado.
- Uso acotado de SQL dinámico (`$queryRaw` solo en health con literal fijo).

## Needs validation (requiere revisión en staging/producción)

1. **Cabeceras de seguridad** — `next.config.ts` vacío; confirmar HSTS/CSP/frame ancestors en Vercel.
2. **Rate limiting de login** — no visible en código; confirmar WAF o límites de plataforma.

## Skills utilizadas

| Skill | Estado |
|-------|--------|
| `security-audit` (Cloudflare) | Instalada en `.agents/skills/security-audit`; workflow completo aplicado. |
| Autoskills (Vercel/React/Next/Prisma/Vitest, etc.) | **No instaladas aún** — `npx autoskills` quedó en prompt interactivo (17 skills seleccionadas, falta confirmar con Enter). |

Para completar la revisión de **buenas prácticas de stack** (React/Next/Prisma), termina la instalación en la terminal con Enter o ejecuta:

```bash
npx skills add vercel-labs/agent-skills --skill next-best-practices -y
```

(ajusta según los paquetes que elijas en autoskills).

## Prioridad de remediación recomendada

1. Añadir `hasPermission(..., 'canManageConfiguracion')` en POST de grupos y roles parroquiales.
2. Revalidar usuario en callback JWT o acortar vida de sesión + invalidación al cambiar rol/estado.
3. Corregir y ampliar `middleware.ts` matcher; reactivar restricciones comentadas.
4. Cambiar permiso de constancias PDF a `canGenerateConstancias`.
5. Definir `headers()` en `next.config.ts` y validar en staging.

## Artefactos

- `architecture.md` — mapa de confianza y superficies.
- `findings.json` — registros estructurados (schema Cloudflare).
- `run-metadata.json` — metadatos de la corrida.

**Nota:** El validador `validate-findings.cjs` no pudo ejecutarse en este entorno Windows (requisito POSIX de lectura no-follow); la revisión de esquema fue manual contra `report-schema.json`.

## Cobertura parcial declarada

Esta corrida no agotó el ledger determinístico completo del skill (hunting multi-ola con presupuesto de subagentes). Áreas revisadas: auth, middleware, permisos, APIs, modelo multi-tenant, setup, constancias, configuración. No se probó despliegue live ni fuzzing.
