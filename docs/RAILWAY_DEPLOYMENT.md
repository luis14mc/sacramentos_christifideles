# ChristiFideles — Despliegue en Railway

Guía para montar **app Next.js + PostgreSQL** en [Railway](https://railway.app). Sustituye o complementa el stack Vercel + Neon del sprint anterior.

## Arquitectura

| Componente | Railway |
|------------|---------|
| App | Servicio **Web** (Nixpacks, ver `railway.toml`) |
| Base de datos | Plugin **PostgreSQL** en el mismo proyecto |
| Migraciones | `prisma migrate deploy` en cada arranque (`scripts/railway-start.mjs`) |
| Health | `GET /api/health` (DB + `SELECT 1`) |

## 1. Crear proyecto

1. [railway.app](https://railway.app) → **New Project**.
2. **Add PostgreSQL** (servicio Postgres 15+).
3. **New** → **GitHub Repo** → `luis14mc/sacramentos_christifideles`, rama `master`.
4. Railway detecta `railway.toml` (build/start/healthcheck).

## 2. Variables de entorno (servicio Web)

En el servicio de la app, **Variables** (referencia al Postgres con `${{Postgres.*}}` si Railway lo ofrece):

| Variable | Valor |
|----------|--------|
| `DATABASE_URL` | URL JDBC/Postgres del plugin (pública o **internal** para menor latencia) |
| `DIRECT_URL` | Misma URL que `DATABASE_URL` en Railway (una sola conexión; no hay pooler tipo Neon) |
| `NEXTAUTH_URL` | URL pública del servicio, p. ej. `https://christifideles-production.up.railway.app` |
| `NEXTAUTH_SECRET` | Secreto largo aleatorio (distinto por entorno) |
| `ALLOW_INITIAL_SETUP` | `false` en producción; `true` solo en el **primer** bootstrap de BD vacía |
| `NODE_ENV` | `production` (Railway suele fijarlo) |

Opcional tras el primer deploy estable:

- `ALLOW_INITIAL_SETUP=false` (obligatorio en prod).
- Catálogos/seed: ejecutar seed **una vez** desde tu máquina apuntando a la BD de Railway, o usar `/setup` con `ALLOW_INITIAL_SETUP=true` solo en ventana controlada.

**No** commitear `.env`. Ver `.env.example`.

### Generar `NEXTAUTH_SECRET`

```bash
openssl rand -base64 32
```

## 3. Dominio público

En el servicio Web → **Settings** → **Networking** → **Generate Domain** (o dominio custom).

Actualizar `NEXTAUTH_URL` para que coincida **exactamente** con la URL HTTPS (sin barra final).

## 4. Build y arranque (automático)

`railway.toml`:

- **Build:** `pnpm install`, `prisma generate`, `next build`
- **Start:** `pnpm run start:railway` → `migrate deploy` + `next start -H 0.0.0.0 -p $PORT`

Railway inyecta `PORT`; la app escucha en todas las interfaces.

## 5. Primera base de datos vacía

1. Deploy con Postgres vacío.
2. El start aplica `prisma/migrations/` (incluye extensión `citext`).
3. Bootstrap (elige una):
   - **Setup UI:** `/setup` con `ALLOW_INITIAL_SETUP=true` temporalmente.
   - **Seed admin (dev/QA):** desde local con `DATABASE_URL` de Railway y variables `SEED_*` (ver `.env.example`); no usar credenciales de demo en producción real.

4. Volver a poner `ALLOW_INITIAL_SETUP=false`.

### Base ya existente (migrada con `db push` antes)

Si la BD ya tiene tablas sin historial de migraciones:

```bash
pnpm exec prisma migrate resolve --applied 20260922004338_init
pnpm exec prisma migrate deploy
```

(Ejecutar contra la URL de Railway, una sola vez, con cuidado.)

## 6. Verificación post-deploy

```bash
export BASE_URL="https://tu-dominio.up.railway.app"
curl -fsS "$BASE_URL/api/health"
BASE_URL="$BASE_URL" pnpm run smoke
```

Esperado: health `status: ok`, `/api/dashboard` → `401` sin sesión.

## 7. Docker (opcional)

Para probar en local sin Railway:

```bash
docker build -t christifideles .
docker run --rm -p 3000:3000 --env-file .env christifideles
```

En Railway puedes cambiar el builder a Dockerfile en el dashboard; por defecto se usa **Nixpacks** (`railway.toml`).

## 8. Staging vs producción

- **Dos proyectos Railway** (recomendado): staging + prod, cada uno con su Postgres y secretos distintos.
- No reutilizar `NEXTAUTH_SECRET` ni `DATABASE_URL` entre entornos.

## 9. Checklist release

- [ ] `prisma/migrations/` versionadas en git
- [ ] CI verde (`migrate deploy` + tests)
- [ ] `NEXTAUTH_URL` = URL real
- [ ] `ALLOW_INITIAL_SETUP=false` en prod
- [ ] Smoke test OK
- [ ] Backup del Postgres (Railway snapshots / export periódico)

## 10. Troubleshooting

| Síntoma | Causa probable |
|---------|----------------|
| Health 503 `database unavailable` | `DATABASE_URL` incorrecta o Postgres no enlazado al servicio |
| Error `citext` | Postgres antiguo; usar imagen 15+ en Railway |
| Login redirect loop | `NEXTAUTH_URL` no coincide con la URL pública |
| Migrate falla al arrancar | BD con esquema manual sin `migrate resolve` |
| Build falla en pnpm | Falta `pnpm-lock.yaml` o lock desactualizado |

## Referencias

- `docs/STAGING_DEPLOYMENT.md` (conceptos compartidos con Vercel/Neon)
- `docs/BACKUP_RESTORE_RUNBOOK.md`
- `AGENTS.md` — no usar `db push` como mecanismo normal de producción
