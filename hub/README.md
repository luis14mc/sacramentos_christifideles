# Centralizador (hub) — ChristiFideles

Servicio central que conecta las instancias parroquiales para las **consultas
entre parroquias** (solo lectura, con aprobación manual). Tiene su propia BD y
**nunca guarda datos sacramentales**: solo el registro de parroquias y la traza
de consultas (DNI como hash SHA-256).

## Ramas
| Rama | Qué se despliega |
|------|------------------|
| `hub` | Este centralizador (servicio Railway del hub) |
| `master` | El software de cada parroquia (un servicio Railway por parroquia) |

El contrato y la firma de interoperabilidad (`src/lib/interop/firma.ts` y
`contrato.ts`) los usan **ambos lados**. Si cambian en `master`, se traen SOLO
esos dos archivos (⚠️ **nunca** `git merge master` en `hub`: `master` no tiene la
carpeta `hub/` y el merge la borraría):

```bash
git checkout hub
git checkout origin/master -- src/lib/interop/firma.ts src/lib/interop/contrato.ts
git commit -m "chore(hub): sincronizar contrato de interoperabilidad desde master"
```

Trabajo nuevo del centralizador: ramas `feature/hub-*` que salen de `hub` y se
mergean a `hub` (nunca a `master`).

## Despliegue en Railway
> En esta rama, los scripts raíz `build`, `start` y `start:railway` del
> `package.json` arrancan el centralizador (no la app parroquial). Así el servicio
> levanta el hub aunque Railway tenga guardado un comando de inicio antiguo.

- Source → Branch: **`hub`** (imprescindible: con `master` se construye la app parroquial)
- Root Directory: vacío. En esta rama el `railway.toml` de la raíz ya construye el
  centralizador; no hace falta configurar "Railway config file".
- **PostgreSQL propio y vacío** (no reutilizar la BD de una parroquia).
- Variables:
  - `DATABASE_URL=${{Postgres.DATABASE_URL}}`
  - `HUB_CLAVE_MAESTRA` (`openssl rand -base64 32`, guardarla: cifra las llaves y firma la sesión del panel)
  - `HUB_ADMIN_PASSWORD` (mín. 12 caracteres): contraseña del panel
  - `HUB_ADMIN_USUARIO` (opcional, por defecto `admin@christifideles.org`)

## Panel web (`/panel`)
- **Inicio:** consultas totales, pendientes, aprobadas, rechazadas, últimos 30 días y
  semáforo de cada parroquia (consulta su `/api/health`).
- **Parroquias:** registrar (la llave `INTEROP_SECRET` se muestra una sola vez),
  suspender/activar, generar llave nueva, editar nombre y URL.
- **Bitácora:** consultas por parroquia y estado. Nunca muestra DNI (ni su hash).
- Seguridad: sesión firmada de 8 h (cookie HttpOnly, SameSite=Strict), límite de 5
  intentos fallidos en 15 min, protección anti-CSRF y cabeceras CSP/no-frame.

## Administración por consola (alternativa al panel)
```bash
cd hub && pnpm instancia registrar <codigo> "<nombre>" https://<dominio>   # imprime INTEROP_SECRET una vez
cd hub && pnpm instancia listar | rotar <codigo> | desactivar <codigo> | activar <codigo>
```

## Desarrollo y tests
```bash
cd hub && pnpm install
HUB_TEST_DATABASE_URL=postgresql://postgres:test@localhost:55432/christifideles_hub_test pnpm test
```
