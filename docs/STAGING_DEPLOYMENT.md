# ChristiFidelis — Staging Deployment

## Arquitectura objetivo
- App: Vercel
- DB: Neon PostgreSQL dedicada exclusivamente a staging
- Producción: no se toca en Sprint 7

## Variables Vercel (staging)
Configurar como secretos del proyecto/entorno Preview o Staging:
- `DATABASE_URL`: conexión Neon de staging
- `NEXTAUTH_URL`: URL pública exacta de staging
- `NEXTAUTH_SECRET`: secreto único de staging
- `ALLOW_INITIAL_SETUP=false`

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

### Bloqueo detectado en Sprint 7
A fecha de este sprint el repositorio no contiene `prisma/migrations/`. Por tanto, `migrate deploy` **no está todavía habilitado como mecanismo de bootstrap reproducible**. No sustituirlo silenciosamente por `prisma db push` en staging.

Antes del despliegue real se debe crear y revisar una migración baseline no destructiva a partir del schema/SQL v3, validarla contra una base vacía y definir cómo se baselina una base existente. Hasta entonces, el deploy de staging queda `PENDING` y el Release Candidate es `NO-GO`.

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
