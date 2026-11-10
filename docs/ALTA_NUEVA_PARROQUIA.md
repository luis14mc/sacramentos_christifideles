# Alta de una parroquia nueva

Checklist de punta a punta para sumar una parroquia. Detalle técnico de cada paso en [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md). Tiempo estimado: 2 horas, más la capacitación.

## 0. Datos que pedir a la parroquia
- [ ] Nombre oficial, dirección, teléfono, email.
- [ ] Municipio (código de 4 dígitos; Distrito Central = `0801`).
- [ ] Nombre del párroco que firma las constancias.
- [ ] Logo (PNG o JPG ≤ 1 MB) y PDF de la hoja membretada (o de las constancias con campos) por sacramento.
- [ ] Dominio deseado (por ejemplo `christifideles.<parroquia>.org`) y quién administra su DNS.
- [ ] Lista de usuarios: nombre, email y rol.

Defina el **código** de la instancia: minúsculas y guiones, estable para siempre (por ejemplo `san-jose-obrero`).

## 1. Railway: servicio y base
- [ ] Proyecto Railway nuevo con **PostgreSQL propio** (nunca compartir base, ver [ADR-002](adr/ADR-002-instancia-por-parroquia.md)).
- [ ] Servicio web desde el repo, rama `master`, `railway.toml` de la raíz.
- [ ] Variables (RAILWAY §3 y §3.1):

| Variable | Valor |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | `${{Postgres.DATABASE_URL}}` |
| `NEXTAUTH_URL` | URL pública final (con `https://`, sin `/` final) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` — **nuevo**, no reutilizar |
| `SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD` | primer admin de la parroquia |
| `ADMIN_GENERAL_PASSWORD` | contraseña del admin general (mínimo 10 caracteres) |
| `PARROQUIA_CODIGO`, `PARROQUIA_NOMBRE`, `PARROQUIA_UBICACION`, `PARROQUIA_DIRECCION`, `PARROQUIA_TELEFONO`, `PARROQUIA_EMAIL` | datos del paso 0 |

- [ ] Primer deploy. En el log deben aparecer las migraciones, "✓ Catálogos aplicados" y el seed inicial.
- [ ] `GET /api/health` → `{"status":"ok","database":"ok"}`.
- [ ] `GET /api/instancia` → código y nombre correctos.

## 2. Dominio
- [ ] Dominio personalizado en Railway + registro CNAME en el DNS de la parroquia.
- [ ] Actualizar `NEXTAUTH_URL` con el dominio final y redeploy.
- [ ] Probar el login con el admin del seed.

## 3. Centralizador
- [ ] Registrar la parroquia en el hub: panel `/panel` → alta de parroquia, o `cd hub && pnpm instancia registrar <codigo> "<Nombre>" https://<dominio>`.
- [ ] Copiar el `INTEROP_SECRET` (se muestra **una sola vez**) a la parroquia junto con `INTEROP_HUB_URL`. Redeploy.
- [ ] El semáforo del panel del hub queda en verde.
- [ ] Consulta de prueba ida y vuelta con otra parroquia.

## 4. Respaldos
El workflow `.github/workflows/respaldos.yml` tiene la lista de bases **escrita en el código**:
- [ ] Rama `chore/respaldos-<codigo>`: agregar la base a `matrix.base`, su `case` y el secret `BACKUP_DB_URL_<CODIGO>`; también en `scripts/restaurar-prueba.sh`.
- [ ] Cargar el secret `BACKUP_DB_URL_<CODIGO>` en GitHub.
- [ ] Correr el workflow a mano (`workflow_dispatch`) y confirmar el archivo en R2.
- [ ] Prueba de restauración anotada en [BACKUP_RESTORE_RUNBOOK.md](BACKUP_RESTORE_RUNBOOK.md).

## 5. Configuración en la app (con el párroco)
- [ ] Datos de la parroquia: revisar nombre (que no quede el de otra), párroco que firma y logo.
- [ ] Sectores y capillas.
- [ ] Sacerdotes que celebran.
- [ ] Molde por sacramento + constancia de prueba de cada uno.
- [ ] Usuarios con su rol; cambiar la contraseña del admin general.

## 6. Arranque
- [ ] Capacitación con el [manual](MANUAL_USUARIO.md).
- [ ] [Guion de prueba piloto](GUION_PRUEBA_PILOTO.md) aprobado.
- [ ] Agregar la parroquia a la tabla §2 de [ESTADO_PROYECTO.md](ESTADO_PROYECTO.md) y una entrada en la Bitácora.
