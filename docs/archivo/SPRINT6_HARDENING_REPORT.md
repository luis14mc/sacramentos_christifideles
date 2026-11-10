# Sprint 6 — Reporte de Hardening

Fecha: 2026-08-21
Alcance: auditoría + búsqueda global + dashboard real + endurecimiento. Sin Defunciones, sin staging/producción, sin RLS productivo.

## Endpoints revisados (inventario)

Se revisaron los 27 route handlers bajo `src/app/api`. Todos los endpoints operativos derivan `id_parroquia`, `rol` y `user id` de la **sesión** (`getServerSession`), nunca del request.

| Endpoint | Sesión | RBAC | Tenant desde sesión |
|---|---|---|---|
| personas, personas/[id] | ✓ | canView/ManagePersonas | ✓ |
| usuarios | ✓ | canManageUsuarios | ✓ |
| bautismos, primeras-comuniones, confirmaciones, matrimonios (+[id]) | ✓ | canView/Create/EditSacramentos | ✓ |
| libros | ✓ | canViewSacramentos | ✓ |
| numeradores/[modulo] | ✓ | canViewSacramentos | ✓ |
| constancias/[sacramento]/[id] | ✓ | canViewSacramentos | ✓ (cross-tenant 404) |
| configuracion/constancias | ✓ | canView/ManageConfiguracion | ✓ |
| auditoria | ✓ | canViewReportes | ✓ |
| busqueda | ✓ | canViewPersonas | ✓ |
| dashboard | ✓ | canViewDashboard | ✓ |
| sacerdotes, sectores, ordenes-religiosas, roles, ubicacion/*, configuracion/* | ✓ | según rol | ✓ (catálogos) |
| setup | N/A | bootstrap | Deshabilitado por defecto |
| auth/[...nextauth] | N/A | NextAuth | N/A |

## Hallazgos

### P0 (crítico)
- Ninguno. No se encontraron endpoints operativos sin sesión, sin RBAC, ni que confíen en el tenant del cliente.

### P1 (alto)
- Ninguno nuevo. Se **cerró** una brecha de cobertura de auditoría: Personas y Usuarios no registraban `bitacora_crud` en sus escrituras; ahora auditan C/U/D dentro de `$transaction`.

### P2 (medio)
- **`new PrismaClient()` en 7 rutas de catálogo/config**: `roles`, `ordenes-religiosas`, `ubicacion/departamentos`, `ubicacion/municipios`, `configuracion/roles`, `configuracion/grupos`, `configuracion/sacerdotes`. En serverless conviene el singleton `@/lib/prisma` para no agotar conexiones. `usuarios` ya fue migrado en este sprint. **Recomendación:** migrar las 7 restantes en Sprint 7 (cambio mecánico de bajo riesgo).
- `personas/[id]` PUT acepta `id_parroquia` en el body **solo para rechazarlo** (400 si difiere de la sesión); no es una fuga, pero conviene documentarlo como patrón intencional.

## Correcciones aplicadas
- Auditoría de escrituras en Personas y Usuarios (C/U/D) en transacción.
- `usuarios` migrado a singleton `@/lib/prisma`.
- Dashboard: eliminado el placeholder "actividad reciente" (dato mock) → datos reales del tenant; `Cache-Control: no-store` en la respuesta.
- Búsqueda global: DNI, nombre, apellido, libro, registro y **fecha exacta `YYYY-MM-DD`** para Personas/sacramentos.
- `Cache-Control: no-store` explícito en auditoría y búsqueda global.
- Confirmado: sin endpoints `/api/debug` ni `/api/test`; `setup` deshabilitado salvo `ALLOW_INITIAL_SETUP === "true"`.

## Validación de input (revisada)
- `parseInt`/`BigInt` protegidos (try/catch → 400/404) en auditoría, numeradores, constancias, libros y detalles de sacramentos.
- Paginación con límite máximo (`pageSize` ≤ 100) en todos los listados.
- Allowlists explícitas: módulos de numeración, sacramentos de libros y de constancias (switch, sin nombres de modelo dinámicos).
- Fechas validadas (`Number.isNaN(getTime())`); búsqueda por fecha solo activa para patrón exacto `YYYY-MM-DD`.

## PDF (constancias) — revisado
- Sesión + RBAC (`canViewSacramentos`) + tenant de sesión + allowlist de sacramento.
- Cross-tenant → 404. El cliente solo envía `sacramento` e `id`; el resto se lee del servidor (anti-manipulación).
- **No** se hace fetch de logos/sellos por URL (evita SSRF); el PDF funciona sin ellos.
- `Cache-Control: no-store`.

## Numeradores — revisado
- Sin `MAX()+1`. Reserva atómica (`upsert` + `{ increment: 1 }`, lock de fila). Tenant desde sesión, módulo allowlist, scope `general`. Estrategia sin cambios (correcta).

## Secretos / logs
- `.env.example` contiene solo **placeholders** (`tu-clave-secreta…`, `usuario:password@localhost`), sin valores reales.
- No hay `console.log` de DNI, emails, contraseñas, tokens ni sesión. Se conserva `console.error` para errores técnicos sin secretos.

## Cache / headers
- `Cache-Control: no-store` explícito en dashboard, constancias, auditoría y búsqueda global.
- Los demás route handlers operativos usan sesión y datos tenant-scoped; no se detectó cache público de datos parroquiales sensibles.

## Rate limiting (candidatos, no implementado)
No se introdujo infraestructura nueva (sin Redis). Endpoints candidatos a rate limiting en Sprint 7 / staging:
- **login** (NextAuth credenciales) — mayor prioridad.
- **búsqueda global** (`/api/busqueda`) — consultas amplias.
- **generación de PDF** (`/api/constancias/...`) — costo de CPU.

## Índices (revisión)
El modelo ya define índices útiles para las consultas globales:
- `Persona`: `@@index([id_parroquia, apellidos])`, `@@index([numero_identidad])`, PK `(id_parroquia, numero_identidad)`.
- Sacramentos: `@@index([id_parroquia, fecha_*])` y `@@unique([id_parroquia, numero_libro, numero_pagina, numero_registro])`.
- `bitacora_crud`: `@@index([id_parroquia, nombre_tabla, fecha])`.
- Numeradores: `@@unique([id_parroquia, modulo, scope])`.

**No se añadieron índices nuevos** (los existentes cubren búsqueda por parroquia, apellidos, DNI, libro/registro y fecha). Recomendación futura: si la búsqueda por nombre (`contains`) crece, evaluar índices trigram (`pg_trgm`) en `nombres`/`apellidos` — requiere extensión y migración, fuera de alcance de v1.

## Riesgos restantes
- 7 rutas de catálogo con `new PrismaClient()` (P2).
- Sin rate limiting (aceptable en v1 pre-staging; documentado).
- Búsqueda por `contains` sin índice trigram (aceptable a escala parroquial).

## Recomendaciones para Sprint 7
1. Migrar las 7 rutas de catálogo al singleton `@/lib/prisma`.
2. Añadir rate limiting ligero a login/búsqueda/PDF al preparar staging.
3. Preparar staging (env, migraciones versionadas, `prisma migrate deploy`).
4. Evaluar activación gradual de RLS (ver `docs/RLS_STRATEGY.md`).
