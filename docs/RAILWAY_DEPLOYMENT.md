# ChristiFideles — Despliegue en Railway (DEMO / STAGING)

Guía completa para desplegar **Next.js + PostgreSQL** en [Railway](https://railway.app)
para el demo funcional. Railway es **staging**, **no** producción final.

> **Importante**: este entorno es demostrativo. La base de datos de Railway para
> el demo debe estar **separada** de futuras bases productivas. No usar el mismo
> proyecto Railway para demo y producción.

## Tabla de contenidos

1. [Crear proyecto y servicio PostgreSQL](#1-crear-proyecto-y-servicio-postgresql)
2. [Añadir el servicio web desde GitHub](#2-añadir-el-servicio-web-desde-github)
3. [Variables de entorno obligatorias](#3-variables-de-entorno-obligatorias)
4. [Build command](#4-build-command)
5. [Start command y migraciones](#5-start-command-y-migraciones)
6. [Primer deploy](#6-primer-deploy)
7. [Crear dominio público](#7-crear-dominio-público)
8. [Configurar NEXTAUTH_URL exacto](#8-configurar-nextauth_url-exacto)
9. [Healthcheck](#9-healthcheck)
10. [Ejecutar seed demo manualmente](#10-ejecutar-seed-demo-manualmente)
11. [Cómo revisar logs](#11-cómo-revisar-logs)
12. [Cómo hacer rollback](#12-cómo-hacer-rollback)
13. [Backup y restore básicos](#13-backup-y-restore-básicos)
14. [Cómo recrear demo sin destruir DB](#14-cómo-recrear-demo-sin-destruir-db)
15. [Reset destructivo (sólo emergencia)](#15-reset-destructivo-sólo-emergencia)

---

## Arquitectura

| Componente | Railway |
|------------|---------|
| App | Servicio **Web** (Nixpacks, ver `railway.toml`) |
| Base de datos | Plugin **PostgreSQL** en el mismo proyecto |
| Migraciones | `prisma migrate deploy` en cada arranque (`scripts/railway-start.mjs`) |
| Health | `GET /api/health` (DB + `SELECT 1`) |
| Filesystem | **Efímero**. PDFs y moldes van en `BYTEA` (no requiere volumen) |

---

## 1. Crear proyecto y servicio PostgreSQL

1. [railway.app](https://railway.app) → **New Project** → **Empty Project**.
2. Haz clic en **+ New** → **Database** → **PostgreSQL**.
3. Espera a que el servicio Postgres termine de aprovisionar (~30 s).
4. Haz clic en el servicio Postgres y anota la pestaña **Variables** para confirmar
   `DATABASE_URL` (lo usarás desde el servicio web vía referencia `${{Postgres.DATABASE_URL}}`).

## 2. Añadir el servicio web desde GitHub

1. En el mismo proyecto Railway → **+ New** → **GitHub Repo**.
2. Selecciona `luis14mc/sacramentos_christifideles`, rama `master`.
3. Railway detecta `railway.toml` y configura automáticamente:
   - Builder: NIXPACKS
   - Build command: `pnpm install --frozen-lockfile && pnpm exec prisma generate && pnpm run build`
   - Start command: `pnpm run start:railway`
   - Healthcheck: `/api/health` con timeout 120 s.

## 3. Variables de entorno obligatorias

Configúralas en el servicio **Web** → **Variables**. Railway las inyecta antes del
arranque. **No commitear secretos reales.**

| Variable | Valor | Origen |
|----------|-------|--------|
| `DATABASE_URL` | Referencia a `${{Postgres.DATABASE_URL}}` | desde el servicio Postgres |
| `DIRECT_URL` | Misma URL (en Railway no hay pooler separado) | manual |
| `NEXTAUTH_URL` | URL pública de Railway (ver §8) | manual |
| `NEXTAUTH_SECRET` | Secreto aleatorio de 32+ bytes (ver generación abajo) | manual |
| `ALLOW_INITIAL_SETUP` | `false` | manual |
| `NODE_ENV` | `production` (lo fija Railway por defecto, pero confirmar) | automático |
| `DEMO_ADMIN_PASSWORD` | contraseña del Super Admin demo (mín 8 caracteres) | manual |
| `DEMO_SECRETARIO_PASSWORD` | contraseña del Secretario demo | manual |
| `DEMO_CATEQUISTA_PASSWORD` | contraseña del Catequista demo | manual |

Generar `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

> **Importante**: el secreto debe ser **distinto por entorno** (staging ≠ producción).

## 4. Build command

Definido en `railway.toml`:

```toml
[build]
builder = "NIXPACKS"
buildCommand = "corepack enable && corepack prepare pnpm@10 --activate && pnpm install --frozen-lockfile && pnpm exec prisma generate && pnpm run build"
```

- `corepack` activa pnpm exacto declarado en `packageManager` (10.15.0).
- `--frozen-lockfile` garantiza builds reproducibles (mismas versiones).
- `prisma generate` antes del build asegura que `node_modules/.prisma` esté disponible
  para `next build`.

## 5. Start command y migraciones

Definido en `railway.toml`:

```toml
[deploy]
startCommand = "pnpm run start:railway"
```

`scripts/railway-start.mjs`:

1. Verifica `DATABASE_URL` (falla rápido si falta).
2. Ejecuta `pnpm exec prisma migrate deploy` — aplica migraciones versionadas
   desde cero sobre BD vacía o nuevas migraciones sobre BD existente.
3. Arranca `next start -H 0.0.0.0 -p ${PORT}`.

### Lo que NO se ejecuta en Railway
- `prisma db push` (prohibido: sincroniza sin historial).
- `pnpm db:reset:dev` (prohibido por el guard de seguridad del script).
- `pnpm db:seed` (prohibido en producción por el propio `seed.ts`).
- `prisma migrate dev` (no usar en deploy; solo en desarrollo local).
- `--force-reset` en cualquier migrate.

## 6. Primer deploy

1. Confirma que las variables están todas configuradas (especialmente
   `DEMO_*_PASSWORD`, sin las cuales no podrás iniciar sesión).
2. Haz push a `master` o espera al merge del PR correspondiente.
3. En Railway, abre el servicio Web → **Deployments**.
4. El primer build puede tardar 3–5 minutos (instalación de pnpm + build).
5. Revisa los logs en tiempo real desde la pestaña **Logs** del servicio.
6. Cuando termine, comprueba el healthcheck:
   - Service → **Settings** → **Deploy** debe mostrar healthcheck success.
   - O manualmente: `curl https://<dominio>.up.railway.app/api/health` → 200 OK.

## 7. Crear dominio público

1. Servicio Web → **Settings** → **Networking** → **Generate Domain**.
2. Railway devuelve un dominio aleatorio tipo
   `https://christifideles-production.up.railway.app`.
3. Para dominio custom (recomendado): Settings → **Custom Domain** →
   introduce tu dominio y configura el CNAME según las instrucciones.

## 8. Configurar NEXTAUTH_URL exacto

Una vez generado el dominio, **actualiza la variable `NEXTAUTH_URL`** con el valor
exacto (sin slash final, con `https://`):

| NEXTAUTH_URL | Resultado |
|--------------|-----------|
| `https://christifideles-production.up.railway.app` | ✅ |
| `http://christifideles-production.up.railway.app` | ❌ (mixed content, CSRF) |
| `https://christifideles-production.up.railway.app/` | ❌ (slash final puede romper callbacks) |
| `https://tu-dominio.com` | ✅ (si configuraste custom domain) |

Tras cambiar `NEXTAUTH_URL`, redeploya (Railway → **Redeploy**).

## 9. Healthcheck

`GET /api/health` está configurado en `railway.toml` con timeout 120 s. Devuelve:

| Estado | HTTP | Cuerpo |
|--------|------|--------|
| App + DB OK | 200 | `{"status":"ok","database":"ok"}` |
| DB caída | 503 | `{"status":"degraded","database":"unavailable"}` |

**Importante**: el healthcheck **no expone** detalles del error, DSN ni stack trace
(ver `src/app/api/health/route.ts`).

## 10. Ejecutar seed demo manualmente

El seed demo **no se ejecuta automáticamente** en el deploy (es destructivo si se
ejecuta mal). Se corre una vez, manualmente, apuntando a la BD de Railway.

### Desde tu máquina local

1. Asegúrate de tener tu `DATABASE_URL` de Railway como variable de entorno.
2. Verifica conectividad con un SELECT trivial:
   ```bash
   psql "$DATABASE_URL" -c 'SELECT 1;'
   ```
3. Ejecuta las migraciones contra Railway:
   ```bash
   pnpm exec prisma migrate deploy
   ```
4. Ejecuta el seed base (catálogos, parroquia demo):
   ```bash
   NODE_ENV=test pnpm db:seed
   ```
5. Ejecuta el seed demo (usuarios demo, personas, ministros, sacramentos):
   ```bash
   NODE_ENV=development \
     DEMO_ADMIN_PASSWORD='TuPasswordAdmin' \
     DEMO_SECRETARIO_PASSWORD='TuPasswordSecretario' \
     DEMO_CATEQUISTA_PASSWORD='TuPasswordCatequista' \
     pnpm db:seed:demo
   ```
6. Verifica entrando a la app con `demo-admin@cristoresucitado.org` +
   la contraseña del paso 5.

### Idempotencia
- `pnpm db:seed` es idempotente (usa `upsert` por PKs/unique indexes).
- `pnpm db:seed:demo` es idempotente (usa `upsert` por DNI / email / constraints).
- Ambas se pueden correr múltiples veces sin duplicar.

## 11. Cómo revisar logs

- **Railway UI**: Servicio → **Logs** (live tail).
- **Filtrar por nivel**: Railway soporta `Filter logs` por texto (ej. buscar
  `ERROR`, `Healthcheck`, `Seed`).
- **Importante**: el seed **no imprime contraseñas**. Solo imprime los emails
  de los usuarios creados.

## 12. Cómo hacer rollback

Railway mantiene historial de deployments. Para revertir a una versión anterior:

1. Servicio → **Deployments** → elige el commit anterior.
2. **Redeploy** ese commit.
3. **NO** revertir migraciones (migraciones versionadas son forward-only).
   Si una migración subió datos, el rollback la deja; tras rollback ejecuta
   `prisma migrate resolve --applied <migracion_fallida>` si fuera necesario.

> Si la release tiene un bug en código, revertir el código es seguro. Si la
> release rompió schema, el camino es: forward fix + nueva migración.

## 13. Backup y restore básicos

Ver `docs/DEMO_BACKUP_RESTORE.md` para el runbook completo. Resumen:

```bash
# Backup (exporta a archivo local)
pg_dump "$DATABASE_URL" -Fc -f demo-$(date +%F).dump

# Restore (sobre BD vacía)
createdb demo_restore
pg_restore -d demo_restore demo-2026-XX-XX.dump
```

**Nunca** commitear archivos `.dump` al repositorio. Almacenar en disco local
o en un sistema externo cifrado.

## 14. Cómo recrear demo sin destruir DB

Si quieres **resetear los datos demo** sin tocar el esquema:

1. Ejecuta `pnpm db:seed:demo` (es idempotente — usa los mismos DNIs / emails,
   no duplica y actualiza los datos existentes con los del seed).

Si quieres **empezar desde cero con datos demo**:

1. Borrar SOLO los registros demo (no la BD):
   ```sql
   DELETE FROM molde_constancia;
   DELETE FROM plantilla_constancia;
   DELETE FROM matrimonio WHERE nota_marginal LIKE '%(demo)%';
   DELETE FROM confirmacion WHERE nota_marginal LIKE '%(demo)%';
   DELETE FROM primera_comunion WHERE nota_marginal LIKE '%(demo)%';
   DELETE FROM bautismo WHERE nota_marginal LIKE '%(demo)%';
   DELETE FROM numeradores WHERE id_parroquia IN (SELECT id_parroquia FROM parroquia WHERE nombre='Cristo Resucitado de Loarque');
   DELETE FROM orden_sacerdotal WHERE id_parroquia IN (SELECT id_parroquia FROM parroquia WHERE nombre='Cristo Resucitado de Loarque');
   DELETE FROM usuario WHERE email LIKE 'demo-%@cristoresucitado.org';
   DELETE FROM persona WHERE numero_identidad LIKE '0801-1985-D%' OR numero_identidad LIKE '0801-1990-D%' OR numero_identidad LIKE '0801-1980-D%' OR numero_identidad LIKE '0801-1988-D%' OR numero_identidad LIKE '0801-19__-P%' OR numero_identidad LIKE '0801-2007-P%' OR numero_identidad LIKE '0801-2008-P%' OR numero_identidad LIKE '0801-2010-P%' OR numero_identidad LIKE '0801-2015-P%';
   ```
2. Vuelve a correr `pnpm db:seed:demo`.

## 15. Reset destructivo (sólo emergencia)

Solo si la BD queda en estado irrecuperable:

1. **Confirma con Product Owner / Scrum Master**. Esto borra TODA la BD.
2. En Railway, abre el servicio Postgres → **Settings** → **Reset Database**.
3. Railway crea una BD nueva vacía.
4. Vuelve a configurar `DATABASE_URL` (Railway lo actualiza automáticamente).
5. Redeploy el servicio web (aplicará migraciones).
6. Re-corre `pnpm db:seed` y `pnpm db:seed:demo` desde tu máquina.

## Troubleshooting

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| Healthcheck 503 "database unavailable" | `DATABASE_URL` incorrecta o Postgres no enlazado | Revisar Variables del servicio Web |
| Login redirect loop | `NEXTAUTH_URL` no coincide con dominio público | Actualizar `NEXTAUTH_URL` y redeploy |
| `prisma migrate deploy` falla al arrancar | BD con esquema manual sin `migrate resolve` | Ver `docs/MIGRATIONS_PRISMA.md` § "Manejo de una BD existente" |
| Build falla en pnpm | Falta `pnpm-lock.yaml` o lock desactualizado | Regenerar lock con `pnpm install` local, commitearlo |
| `pnpm db:seed:demo` falla con "Faltan variables" | `DEMO_*_PASSWORD` no definidas | Definir las 3 variables antes de ejecutar |
| Sacramentos demo no aparecen | `pnpm db:seed:demo` no se ha corrido | Ejecutar manualmente (ver §10) |

## Referencias

- `docs/MIGRATIONS_PRISMA.md` — ciclo de migraciones y manejo de BD existente.
- `docs/DEMO_GOLDEN_PATH.md` — flujos de demo.
- `docs/DEMO_BACKUP_RESTORE.md` — backup/restore runbook.
- `docs/STORAGE_AUDIT.md` — auditoría de almacenamiento (filesystem vs BYTEA).
