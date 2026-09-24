# ChristiFideles — Despliegue en Railway

Guía completa para desplegar **Next.js + PostgreSQL** en [Railway](https://railway.app).

## Arquitectura

Cada parroquia que adopte ChristiFideles tendrá **su propio proyecto Railway
independiente**, con su propio servicio PostgreSQL y su propio servicio Web:

```
Railway Project (por parroquia)
├── PostgreSQL           ← servicio gestionado
└── sacramentos_christifideles  ← servicio web (este repo)
```

El environment de Railway puede llamarse `production` por defecto; este
documento no asume separación obligatoria entre staging y producción final.

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
16. [Interoperabilidad: hub y parroquias](#16-interoperabilidad-hub-y-parroquias)

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
| `SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD` | credenciales del primer admin de **esta** parroquia (el seed corre solo si la BD no tiene usuarios) | manual |
| `NODE_ENV` | `production` (lo fija Railway por defecto, pero confirmar) | automático |
| `DEMO_ADMIN_PASSWORD` | contraseña del Super Admin demo (mín 8 caracteres) | manual |
| `DEMO_SECRETARIO_PASSWORD` | contraseña del Secretario demo | manual |
| `DEMO_CATEQUISTA_PASSWORD` | contraseña del Catequista demo | manual |

> Ya no existe el asistente web `/setup`: cada instancia se inicializa sola en
> su primer deploy (`scripts/railway-start.mjs`). En **cada** arranque corren las
> migraciones y `pnpm db:seed:catalogos` (departamentos, municipios, roles,
> órdenes y rangos; idempotente). Solo con la BD vacía corre además el seed de
> la parroquia de `PARROQUIA_*` y su admin.

### 3.1 Una instancia por parroquia

Cada parroquia es un **proyecto Railway propio** (servicio web + PostgreSQL
propio). Nunca se comparte base de datos. Además de las variables anteriores:

| Variable | Ejemplo | Uso |
|----------|---------|-----|
| `PARROQUIA_CODIGO` | `salvador-del-mundo` | Slug estable de la instancia (interoperabilidad). Minúsculas y guiones. |
| `PARROQUIA_NOMBRE` | `Salvador del Mundo de Cerro Grande` | Nombre usado por el seed. Si falta, el seed usa Cristo Resucitado. |
| `PARROQUIA_UBICACION` | `0801` | Código de municipio (4 dígitos). Default `0801`. |
| `PARROQUIA_DIRECCION` | `Cerro Grande, Distrito Central` | Dirección. |
| `PARROQUIA_TELEFONO` | `+504 0000-0000` | Teléfono. |
| `PARROQUIA_EMAIL` | `secretaria@...` | Opcional. |

Verificación: `GET /api/instancia` devuelve `{ codigo, nombre, version }`.
Plan completo en `docs/PLAN_MULTIPARROQUIA.md`.

Generar `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

> **Importante**: el secreto debe ser **distinto por entorno** (cada
> parroquia debe tener su propio `NEXTAUTH_SECRET`; nunca reutilizar entre
> proyectos Railway diferentes).

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
- `prisma db push` (sincroniza sin historial).
- `pnpm db:reset:dev` (destructivo; bloqueado por guard interno).
- `prisma migrate dev` (no usar en deploy; solo en desarrollo local).
- `pnpm db:seed:demo` **sin** `ALLOW_DEMO_SEED=true` (guard explícito).
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

El seed demo **requiere explícitamente** la variable `ALLOW_DEMO_SEED=true`.
Esto es independiente de `NODE_ENV`: en Railway el environment es `production`
y eso **no** debe bloquear una operación autorizada y puntual.

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
   ALLOW_DEMO_SEED=true \
     DEMO_ADMIN_PASSWORD='TuPasswordAdmin' \
     DEMO_SECRETARIO_PASSWORD='TuPasswordSecretario' \
     DEMO_CATEQUISTA_PASSWORD='TuPasswordCatequista' \
     pnpm db:seed:demo
   ```
6. Verifica entrando a la app con `demo-admin@cristoresucitado.org` +
   la contraseña del paso 5.
7. **Restaura el guard** cuando termines:
   ```bash
   unset ALLOW_DEMO_SEED
   ```

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

El seed demo es **idempotente** por diseño (usa `upsert` por DNI / email /
constraints únicos):

- **Volver a correr el mismo seed** sobre la BD Railway existente no duplica
  registros ni rompe datos; actualiza los existentes con los valores del seed.
- Para "empezar de cero" sin perder otros datos de la misma parroquia, la
  opción segura es recrear el entorno desde Railway (ver §15). **No
  documentamos `DELETE FROM ...` manuales** para evitar pérdidas accidentales
  sobre la BD de la parroquia.

Si necesitas resetear los datos demo desde fuera de Railway, usa un backup
previo (ver §13) como red de seguridad.

## 15. Reset destructivo (sólo emergencia)

Solo si la BD queda en estado irrecuperable:

1. **Confirma con Product Owner / Scrum Master**. Esto borra TODA la BD.
2. En Railway, abre el servicio Postgres → **Settings** → **Reset Database**.
3. Railway crea una BD nueva vacía.
4. Vuelve a configurar `DATABASE_URL` (Railway lo actualiza automáticamente).
5. Redeploy el servicio web (aplicará migraciones).
6. Re-corre `pnpm db:seed` y `pnpm db:seed:demo` desde tu máquina.

## 16. Interoperabilidad: hub y parroquias

Arquitectura: **tres servicios, tres PostgreSQL**. Ninguna base se comparte.

| Servicio | Código | Config | BD |
|----------|--------|--------|----|
| `cristo-resucitado` | raíz del repo | `railway.toml` | Postgres propio |
| `salvador-del-mundo` | raíz del repo | `railway.toml` | Postgres propio |
| `hub` | `hub/` | `hub/railway.toml` (Root Directory **vacío**) | Postgres propio |

### 16.1 Hub
1. Nuevo servicio desde el mismo repo → Settings → *Railway config file* = `hub/railway.toml`.
2. Agregar un plugin PostgreSQL propio al hub.
3. Variables:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `${{Postgres-hub.DATABASE_URL}}` |
| `HUB_CLAVE_MAESTRA` | `openssl rand -base64 32` (si se pierde, hay que rotar los secretos de todas las instancias) |

4. Dominio público y comprobación: `GET https://<hub>/api/health` → `{"status":"ok"}`.

### 16.2 Registrar cada parroquia en el hub
Desde la shell del servicio hub (`railway ssh` o `railway run`):

```bash
cd hub && pnpm instancia registrar cristo-resucitado "Cristo Resucitado de Loarque" https://<url-cristo>
cd hub && pnpm instancia registrar salvador-del-mundo "Salvador del Mundo de Cerro Grande" https://<url-salvador>
```

Cada comando imprime **una sola vez** un `INTEROP_SECRET`: cópialo a las variables de esa parroquia.

### 16.3 Variables en cada parroquia (además de §3 y §3.1)

| Variable | Valor |
|----------|-------|
| `PARROQUIA_CODIGO` | el mismo código registrado en el hub |
| `INTEROP_HUB_URL` | `https://<hub>` |
| `INTEROP_SECRET` | el secreto impreso por `registrar` |

Sin estas tres variables la parroquia funciona normalmente, pero `/consultas` muestra "no configurada".

### 16.4 Operación
- **Rotar un secreto:** `pnpm instancia rotar <codigo>` y actualizar `INTEROP_SECRET` en esa parroquia. Hasta que se actualice, sus consultas fallan con 401.
- **Suspender una parroquia:** `pnpm instancia desactivar <codigo>` (`activar` para revertir).
- **Ver registradas:** `pnpm instancia listar`.
- **Relojes:** las firmas rechazan desfases de más de 5 minutos. Railway usa NTP, así que no requiere acción.

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
