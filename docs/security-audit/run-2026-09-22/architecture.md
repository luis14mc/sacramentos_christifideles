# ChristiFideles — resumen de arquitectura (auditoría)

## Producto y activos protegidos

Aplicación web parroquial (Next.js 16, NextAuth JWT, Prisma/PostgreSQL) para registrar personas, sacramentos, libros, constancias PDF, usuarios y auditoría. Datos sensibles: identidad civil (DNI), datos sacramentales, usuarios y bitácoras.

## Principales y fronteras de confianza

| Principal | Autoridad esperada |
|-----------|-------------------|
| Anónimo | Solo login, setup (si habilitado), health |
| Usuario autenticado (JWT) | Operaciones según rol y `id_parroquia` de sesión |
| Admin parroquial / Super Admin | Gestión de usuarios y configuración |

Fronteras críticas: middleware (UI), handlers `/api/*` (datos), JWT (rol/parroquia), consultas Prisma (`id_parroquia`).

## Superficies de entrada

- Rutas App Router (`src/app/**`) — muchas páginas client-side con `fetch` a API.
- ~46 route handlers en `src/app/api/**`.
- NextAuth credentials en `src/lib/auth.ts`.
- Bootstrap `POST /api/setup` condicionado por `ALLOW_INITIAL_SETUP`.

## Controles fuertes observados en código

- Mayoría de APIs sacramentales/personas: sesión + `hasPermission` + filtro `id_parroquia`.
- Escalación a Super Admin bloqueada en `src/app/api/usuarios/route.ts`.
- Setup inicial deshabilitado por defecto en `.env.example`.
- Sin rutas `/api/debug` en el árbol actual.

## Áreas de mayor riesgo (plan de cobertura)

1. Autorización inconsistente en catálogos de configuración (`configuracion/grupos`, `configuracion/roles`).
2. Confianza en JWT sin revalidación de rol/estado en BD.
3. Middleware incompleto frente a rutas reales de la UI.
4. Permiso de emisión de constancias PDF vs matriz de roles.
5. Cabeceras HTTP y hardening de despliegue (no definidos en repo).
