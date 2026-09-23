# Backup y Restore — ChristiFideles DEMO

Procedimientos seguros para respaldar y restaurar la base de datos PostgreSQL del
entorno demo (Railway o local), **sin filtrar credenciales**.

> **Nunca** commitear archivos `.dump`, `.sql` ni credenciales al repositorio.
> Este runbook usa **variables de entorno** y placeholders genéricos.

## Variables de entorno

```bash
# Local
export PGHOST="localhost"
export PGPORT="5432"
export PGUSER="testuser"
export PGPASSWORD="testpwd"
export PGDATABASE="cf_demo"

# Railway (obtenido del dashboard Railway -> Postgres -> Variables)
# NO incluir DATABASE_URL en comandos versionados. Usar:
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require"
```

Para hacer backup desde Railway, copiar `DATABASE_URL` desde el panel
**Connect** del servicio Postgres a la variable local (temporal, no persistir).

## Backup con `pg_dump`

### Backup custom (recomendado, formato binario comprimido)

```bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
pg_dump "$DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --file="christifideles-demo-${TIMESTAMP}.dump"
```

- `--format=custom` permite `pg_restore` selectivo.
- `--compress=9` máxima compresión.
- `--no-owner --no-privileges` evita problemas de roles al restaurar.

### Backup SQL plano (legible, útil para auditoría)

```bash
pg_dump "$DATABASE_URL" \
  --format=plain \
  --no-owner \
  --no-privileges \
  --file="christifideles-demo-${TIMESTAMP}.sql"
```

Advertencia: el SQL plano **contiene datos demo** (incluyendo DNIs ficticios y
hashes de contraseñas). Tratar como información sensible, no publicar.

### Restaurar en BD local (vacía)

```bash
# 1. Crear BD destino
createdb christifideles_restore

# 2. Restaurar
pg_restore \
  --dbname=christifideles_restore \
  --no-owner \
  --no-privileges \
  --jobs=4 \
  christifideles-demo-20260923-153000.dump
```

### Restaurar SQL plano

```bash
psql christifideles_restore < christifideles-demo-20260923-153000.sql
```

## Verificación post-restore

Siempre verificar tras un restore:

```bash
# Conteo por tabla
psql "$DATABASE_URL" <<'SQL'
SELECT 'parroquia' AS tabla, COUNT(*) FROM parroquia
UNION ALL SELECT 'persona', COUNT(*) FROM persona
UNION ALL SELECT 'usuario', COUNT(*) FROM usuario
UNION ALL SELECT 'bautismo', COUNT(*) FROM bautismo
UNION ALL SELECT 'primera_comunion', COUNT(*) FROM primera_comunion
UNION ALL SELECT 'confirmacion', COUNT(*) FROM confirmacion
UNION ALL SELECT 'matrimonio', COUNT(*) FROM matrimonio
UNION ALL SELECT 'orden_sacerdotal', COUNT(*) FROM orden_sacerdotal
UNION ALL SELECT 'molde_constancia', COUNT(*) FROM molde_constancia
ORDER BY tabla;
SQL

# Pruebas de integridad referencial
psql "$DATABASE_URL" -c "
SELECT COUNT(*) AS bautismos_con_persona_inexistente
FROM bautismo b
LEFT JOIN persona p
  ON p.id_parroquia = b.id_parroquia
 AND p.numero_identidad = b.numero_identidad_bautizado
WHERE p.numero_identidad IS NULL;"

# Sin huérfanos esperados (debe ser 0)
```

## Backup programado (cron local o Railway cron job)

Si quieres automatizar backups periódicos:

```bash
#!/bin/bash
# /usr/local/bin/christifideles-backup.sh (NO commitear)
set -euo pipefail
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/secure/christifideles-backups"
mkdir -p "$BACKUP_DIR"
pg_dump "$DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --file="$BACKUP_DIR/cf-demo-${TIMESTAMP}.dump"

# Mantener últimos 14 días
find "$BACKUP_DIR" -type f -name 'cf-demo-*.dump' -mtime +14 -delete
```

Para Railway, esta automatización corre en un cron separado (no dentro del
servicio web). Configurar en el **Cron** plugin de Railway o un job externo.

## Restauración sobre Railway (en caso de incidente)

1. **NO** restaurar directamente sobre el Postgres de Railway sin coordinación.
2. Crear un **segundo proyecto Railway** (staging-restauracion) con un Postgres
   propio.
3. Configurar `DATABASE_URL` apuntando al nuevo Postgres.
4. `prisma migrate deploy` para aplicar migraciones.
5. `pg_restore` los datos.
6. Validar con healthcheck + seed idempotente.
7. Solo entonces considerar promover.

## Política de retención

| Entorno | Retención | Ubicación |
|---------|-----------|-----------|
| Local dev | 14 días | disco local cifrado |
| Staging/Demo | 14 días | ubicación externa cifrada |
| Producción (futura) | 30+ días, con WORM | sistema externo (R2/S3) |

## Errores comunes

| Error | Causa | Solución |
|-------|-------|---------|
| `FATAL: password authentication failed for user` | `DATABASE_URL` mal formada o expirada | Regenerar connection string desde Railway |
| `pg_dump: server version mismatch` | Cliente `pg_dump` más antiguo que servidor | Actualizar cliente (`brew install postgresql@16` o `apt install postgresql-client-16`) |
| `pg_restore: could not execute statement: already exists` | BD destino no está vacía | Truncar primero o usar BD recién creada |
| `permission denied for schema public` | Usuario sin permisos de CREATE en esquema | Restaurar en BD propia del usuario, no en BD compartida |
| `out of memory` en restore de BD grande | `pg_restore` con muchos jobs en paralelo | Reducir `--jobs` a 1 o 2 |

## Seguridad

- ✅ Usar variables de entorno para contraseñas.
- ✅ Almacenar backups en disco cifrado (LUKS / FileVault / BitLocker).
- ❌ Nunca subir `.dump` ni `.sql` a Git.
- ❌ Nunca pegar `DATABASE_URL` en issues o logs públicos.
- ❌ Nunca restaurar un backup en una BD que apunte a `production` real.
