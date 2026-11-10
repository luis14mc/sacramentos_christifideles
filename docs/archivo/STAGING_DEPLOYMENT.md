# ChristiFidelis — Staging Deployment

## Arquitectura objetivo
- App: **Railway** (recomendado, ver `docs/RAILWAY_DEPLOYMENT.md`) o Vercel
- DB: PostgreSQL dedicada a staging (Railway Postgres o Neon)
- Producción: entorno separado con secretos distintos

## Variables Vercel (staging)
Configurar como secretos del proyecto/entorno Preview o Staging:
- `DATABASE_URL`: conexión Neon de staging
- `NEXTAUTH_URL`: URL pública exacta de staging
- `NEXTAUTH_SECRET`: secreto único de staging

No reutilizar secretos ni DATABASE_URL de producción.

## Build
```bash
npm ci
npx prisma generate
npx prisma validate
npm run build
```

## Migraciones
El flujo objetivo es:
```bash
npx prisma migrate deploy
```

### Estado migraciones
El repositorio incluye migración baseline en `prisma/migrations/` (extensión `citext` + esquema v3). En staging/producción usar siempre `prisma migrate deploy`. Si la BD ya existía sin historial Prisma, ver `migrate resolve` en `docs/RAILWAY_DEPLOYMENT.md`.

## Healthcheck
Después del despliegue:
```bash
curl -fsS "$BASE_URL/api/health"
BASE_URL="$BASE_URL" npm run smoke
```

## Gate de promoción
No promover a producción mientras exista cualquiera de estos puntos:
- migraciones no reproducibles;
- P0/P1 abierto;
- fallo multi-tenant;
- build/tests rojos;
- backup/restore sin procedimiento validado;
- staging no ejecutado con base separada.
