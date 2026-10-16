# ChristiFidelis — Backup & Restore Runbook

## Objetivo
Procedimiento reproducible para respaldar y restaurar PostgreSQL/Neon sin mezclar staging y producción.

## Reglas
- Ejecutar siempre contra la URL del entorno correcto.
- Nunca restaurar staging sobre producción ni viceversa.
- No guardar dumps con datos reales en Git.
- Verificar que el destino esté identificado antes de ejecutar restore.

## Backup lógico
Con `pg_dump` disponible:

```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl --file=christifidelis.dump
```

Verificar que el archivo exista y tenga tamaño mayor que cero.

## Verificación básica del backup

```bash
pg_restore --list christifidelis.dump > backup-contents.txt
```

El listado debe incluir las tablas críticas: `persona`, sacramentos, `numeradores`, `plantilla_constancia`, usuarios y `bitacora_crud`.

## Restore en base temporal/staging
Crear una base vacía separada y definir `RESTORE_DATABASE_URL`.

```bash
pg_restore --clean --if-exists --no-owner --no-acl --dbname="$RESTORE_DATABASE_URL" christifidelis.dump
```

No usar `--clean` contra producción sin un procedimiento de incidente aprobado.

## Comprobaciones posteriores
1. Ejecutar `SELECT 1`.
2. Verificar conteos de parroquias, Personas y sacramentos.
3. Confirmar que las dos parroquias QA conservan aislamiento.
4. Ejecutar la aplicación apuntando a la base restaurada.
5. Ejecutar `/api/health` y smoke tests.
6. Abrir una Persona y un sacramento de cada módulo.
7. Generar una constancia PDF.

## Neon
En staging se recomienda además habilitar el mecanismo de backup/restore disponible en Neon (branch/restore point según el plan contratado). El dump lógico sigue siendo útil para una prueba independiente de portabilidad.

## Respaldos automáticos

### Qué hace el pipeline
El workflow `.github/workflows/respaldos.yml` respalda **tres bases** (Loarque, Cerro Grande, hub) cada día a las **02:00 Honduras** (08:00 UTC) o bajo demanda (`workflow_dispatch`).

Por cada base:
1. Conecta con la URL del secret correspondiente.
2. Lee `SHOW server_version_num` e instala `postgresql-client-<major>` desde [apt.postgresql.org](https://www.postgresql.org/download/linux/ubuntu/).
3. `pg_dump --format=custom --no-owner --no-acl`.
4. Verifica con `pg_restore --list` las tablas críticas (ver abajo).
5. Cifra con **age** (llave pública del secret) y **borra el dump en claro** del runner.
6. Sube a **Cloudflare R2** (S3-compatible). Ruta: `<base>/AAAA/MM/<base>-AAAAMMDD-HHMM.dump.age`.

**Prohibido:** artifacts de GitHub con dumps, commits de dumps al repo, imprimir URLs o secretos en logs (el workflow enmascara valores sensibles).

Si falta un secret, el job falla indicando **el nombre** del secret (sin valor).

### Bucket R2 y retención 30 días
1. En Cloudflare → **R2** → **Create bucket** (por ejemplo `christifideles-backups`).
2. **Manage R2 API tokens** → token con permiso de lectura/escritura sobre ese bucket.
3. En el bucket → **Settings** → **Object lifecycle** (o regla equivalente): eliminar objetos con antigüedad **> 30 días** (prefix vacío o `loarque/`, `cerrogrande/`, `hub/` según prefieras).
4. Anota el **endpoint S3** del bucket (forma `https://<accountid>.r2.cloudflarestorage.com`).

### Par de llaves age
En una máquina de confianza (no Railway, no GitHub, no este repo):

```bash
age-keygen -o christifideles-backup.txt
```

- **Pública** (`age1...`): secret `BACKUP_AGE_PUBLIC_KEY` en GitHub Actions.
- **Privada** (`AGE-SECRET-KEY-...`): solo en gestor de secretos del PO / caja fuerte offline. **No** en Railway, GitHub (salvo si algún día se automatiza restore en CI, hoy no), ni archivos del repositorio.

### Secrets en GitHub (Settings → Secrets and variables → Actions)

| Secret | Uso |
|--------|-----|
| `BACKUP_DB_URL_LOARQUE` | URL Postgres producción Cristo Resucitado |
| `BACKUP_DB_URL_CERROGRANDE` | URL Postgres producción Cerro Grande |
| `BACKUP_DB_URL_HUB` | URL Postgres centralizador (rama `hub`) |
| `BACKUP_AGE_PUBLIC_KEY` | Cifrado en el workflow |
| `BACKUP_S3_ENDPOINT` | Endpoint R2 |
| `BACKUP_S3_BUCKET` | Nombre del bucket |
| `BACKUP_S3_ACCESS_KEY` | Access key R2 |
| `BACKUP_S3_SECRET_KEY` | Secret key R2 |

### Restauración de prueba (mensual recomendada)
1. Crear una base **vacía** dedicada (Railway staging, Neon branch, Postgres local).
2. Exportar `RESTORE_DATABASE_URL` apuntando **solo** a esa base.
3. Exportar `AGE_PRIVATE_KEY` (contenido del archivo age, una sola línea).
4. Mismas variables S3 que en GitHub (`BACKUP_S3_*`) y las tres `BACKUP_DB_URL_*` (el script rechaza restaurar sobre producción).
5. Instalar `awscli`, `age`, cliente PostgreSQL acorde al servidor destino.
6. Ejecutar:

```bash
./scripts/restaurar-prueba.sh loarque   # o cerrogrande / hub
```

7. Revisar conteos impresos al final y ejecutar smoke (`/api/health`, login de prueba).

### Tablas críticas verificadas
- **Parroquias:** `persona`, `bautismo`, `primera_comunion`, `confirmacion`, `matrimonio`, `numeradores`, `usuario`, `bitacora_crud`.
- **Hub:** `instancia`, `solicitud`.

## Estado Sprint 7
La ejecución real de `pg_dump`/`pg_restore` contra Neon requiere credenciales de staging y herramientas PostgreSQL disponibles. Hasta ejecutarla con una base real de QA, la prueba de restore debe registrarse como `PENDING`, no `PASS`.
