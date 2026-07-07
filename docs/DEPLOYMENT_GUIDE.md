# Guía de despliegue — ChristiFideles

Despliegue en **Vercel + Neon PostgreSQL** con aislamiento multi-tenant.

## 1. Requisitos previos

- Cuenta [Vercel](https://vercel.com) con el repositorio conectado
- Proyecto [Neon](https://neon.tech) con PostgreSQL 15+
- (Opcional) [Upstash Redis](https://upstash.com) para rate limit distribuido en login
- (Opcional) [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) para logos persistentes

## 2. Variables de entorno en Vercel

| Variable | Obligatoria | Valor en producción |
|----------|-------------|---------------------|
| `DATABASE_URL` | Sí | Connection string de Neon (pooler recomendado) |
| `NEXTAUTH_URL` | Sí | `https://tu-dominio.vercel.app` |
| `NEXTAUTH_SECRET` | Sí | Secreto aleatorio ≥ 32 caracteres (`openssl rand -base64 32`) |
| `SETUP_SECRET` | Recomendado | Secreto para proteger `POST /api/setup` |
| `ENABLE_DEBUG_API` | Sí | **`false`** o no definir |
| `DATABASE_RLS_ENABLED` | Recomendado | **`true`** tras ejecutar migración RLS |
| `BLOB_READ_WRITE_TOKEN` | Recomendado | Token de Vercel Blob |
| `UPSTASH_REDIS_REST_URL` | Opcional | URL REST de Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Opcional | Token de Upstash |

Ver plantilla completa en [.env.example](../.env.example).

## 3. Base de datos

```bash
# Generar cliente Prisma
npx prisma generate

# Aplicar schema (primera vez o tras cambios)
npx prisma db push

# Seed inicial (desarrollo / staging)
npm run db:seed
npm run db:seed-permissions
```

### Instalación inicial en producción

Opción A — wizard web: visitar `/setup` (solo si no hay parroquia creada).

Opción B — API con secreto:

```bash
curl -X POST https://tu-dominio.vercel.app/api/setup \
  -H "Content-Type: application/json" \
  -H "x-setup-secret: TU_SETUP_SECRET" \
  -d '{"nombreParroquia":"...","municipio":"0801",...}'
```

## 4. Activar Row Level Security (RLS)

1. Ejecutar en Neon SQL Editor o con psql:

   ```bash
   psql "$DATABASE_URL" -f docs/migracion_rls_v6.sql
   ```

2. Verificar:

   ```bash
   npm run verify:rls
   ```

3. En Vercel: `DATABASE_RLS_ENABLED=true`

Detalle en [RLS_ACTIVACION.md](./RLS_ACTIVACION.md).

## 5. Despliegue en Vercel

1. Conectar repositorio GitHub a Vercel
2. Framework: **Next.js** (detectado automáticamente)
3. Build command: `npm run build`
4. Configurar variables de entorno (sección 2)
5. Deploy

Headers de seguridad están en [vercel.json](../vercel.json) y [next.config.ts](../next.config.ts).

## 6. CI / calidad

El workflow [.github/workflows/ci.yml](../.github/workflows/ci.yml) ejecuta en cada PR:

- `npm ci`
- `npx prisma generate`
- `npm run lint`
- `npm run test`
- `npm run build`

## 7. Rollback

- **App:** revertir deploy en Vercel al deployment anterior
- **BD:** Neon soporta branching; para rollback de schema usar backup/point-in-time restore
- **RLS:** desactivar temporalmente con `DATABASE_RLS_ENABLED=false` (el aislamiento por código sigue activo)

## 8. Checklist pre-piloto

- [ ] `ENABLE_DEBUG_API` no definido o `false`
- [ ] `NEXTAUTH_SECRET` único por entorno
- [ ] RLS ejecutado y verificado (`npm run verify:rls`)
- [ ] Logos suben a Blob (`BLOB_READ_WRITE_TOKEN`)
- [ ] Login con rate limit (Upstash en prod multi-instancia)
- [ ] Smoke test E2E: `npm run test:e2e`
