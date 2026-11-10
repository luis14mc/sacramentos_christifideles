# Centralizador (hub) — ChristiFideles

Servicio central que conecta las instancias parroquiales para las **consultas entre parroquias** (solo lectura, con aprobación manual). Tiene su propia base y **nunca guarda datos sacramentales**: solo el registro de parroquias y la traza de consultas (DNI como hash SHA-256).

> Actualizado 2026-11-10. La documentación general del proyecto (estado, manual, ADRs, contrato) vive en **`master`** → `docs/README.md`. Este archivo es la única documentación propia de la rama `hub`.

## 1. Ramas (regla fija — ADR-003 en `master`)
| Rama | Qué se despliega |
|------|------------------|
| `hub` | Este centralizador (un servicio Railway) |
| `master` | El software base de cada parroquia (un servicio Railway + Postgres por parroquia) |

- Trabajo del centralizador: ramas `feature/hub-*` / `fix/hub-*` **desde `hub`**, PR **hacia `hub`** (nunca a `master`).
- ⚠️ **Nunca `git merge master` en `hub`**: `master` no tiene `hub/` y el merge la borraría.
- Lo único que se comparte son dos archivos. Si cambian en `master`, se traen solos:

```bash
git checkout hub && git pull
git checkout origin/master -- src/lib/interop/firma.ts src/lib/interop/contrato.ts
cd hub && pnpm test            # deben seguir en verde
git commit -m "chore(hub): sincronizar contrato de interoperabilidad desde master"
```
Orden de despliegue tras un cambio de contrato: **primero el hub, después las parroquias**. Detalle en `docs/INTEROP_CONTRATO.md` de `master`.

- El resto del árbol de esta rama (`src/app`, `docs/`, `prisma/` de la raíz…) es una **copia vieja de `master`** que el hub no usa. No editarla aquí ni tomarla como referencia.

Comprobar que los archivos compartidos están al día:
```bash
git fetch origin && git diff origin/master -- src/lib/interop/firma.ts src/lib/interop/contrato.ts   # vacío = sincronizado
```

## 2. Qué hace
```
Parroquia origen ──POST /api/solicitudes──► HUB ──POST /api/interop/entrantes──► Parroquia destino
Parroquia origen ◄─POST /api/interop/respuestas── HUB ◄─POST /api/solicitudes/{uuid}/respuesta── destino
```
Toda petición va firmada con HMAC-SHA256 (cabeceras `x-interop-instancia`, `x-interop-timestamp`, `x-interop-firma`; 5 min de tolerancia). El hub verifica con la llave de cada parroquia y vuelve a firmar con la llave del destinatario.

## 3. Código
| Ruta | Qué es |
|---|---|
| `hub/src/server.ts` | Servidor HTTP (Node, sin framework). Puerto `PORT` (Railway) o 4000 |
| `hub/src/router.ts` | Rutas de la API y del panel |
| `hub/src/handlers.ts` | API para las parroquias |
| `hub/src/instancias.ts`, `parroquias.ts` | Alta, suspensión, rotación de llaves |
| `hub/src/cifrado.ts` | Cifrado de llaves con `HUB_CLAVE_MAESTRA` |
| `hub/src/panel/` | Panel web (sesión, vistas HTML) |
| `hub/scripts/instancia.ts` | Administración por consola |
| `hub/prisma/` | Esquema y migraciones propias |
| `hub/tests/` | 23 pruebas (API y panel) |
| `src/lib/interop/` | Archivos compartidos con `master` (no editar aquí) |

## 4. API
| Método | Ruta | Quién | Respuestas |
|---|---|---|---|
| GET | `/api/health` | Railway / monitoreo | `200 {status:'ok'}` · `503` sin base |
| GET | `/api/instancias` | Parroquia (firmada) | Lista de parroquias activas `{codigo, nombre}` |
| POST | `/api/solicitudes` | Parroquia origen (firmada) | `201 {uuid, destino_nombre}` · `400` inválida o destino = origen · `404` destino no registrado o suspendido · `502` destino caído |
| POST | `/api/solicitudes/{uuid}/respuesta` | Parroquia destino (firmada) | `200 {reenviada:true}` · `404` · `409` ya resuelta · `502` origen caído |
Sin firma válida → `401`.

## 5. Datos (`hub/prisma/schema.prisma`)
| Tabla | Campos clave |
|---|---|
| `instancia` | `codigo` (PK), `nombre`, `url`, `secreto_cifrado`, `activa` |
| `solicitud` | `uuid`, `origen`, `destino`, `dni_hash` (SHA-256), `estado`, `created_at`, `resuelta_at` |
No hay nombres, sacramentos ni el motivo de la consulta.

## 6. Despliegue en Railway
> En esta rama los scripts raíz `build`, `start` y `start:railway` y el `railway.toml` de la raíz arrancan el centralizador. Así el servicio levanta el hub aunque Railway tenga guardado un comando viejo.

- Source → Branch: **`hub`** (con `master` se construiría la app parroquial).
- Root Directory: vacío. No hace falta "Railway config file".
- **PostgreSQL propio y vacío** (nunca la base de una parroquia).
- Al arrancar se aplican las migraciones (`prisma migrate deploy`).

| Variable | Obligatoria | Uso |
|---|---|---|
| `DATABASE_URL` | Sí | `${{Postgres.DATABASE_URL}}` |
| `HUB_CLAVE_MAESTRA` | Sí | `openssl rand -base64 32`. Cifra las llaves de las parroquias y firma la sesión del panel |
| `HUB_ADMIN_PASSWORD` | Sí | Contraseña del panel (mín. 12 caracteres) |
| `HUB_ADMIN_USUARIO` | No | Usuario del panel (por defecto `admin@christifideles.org`) |
| `PORT` | No | Lo pone Railway |

⚠️ **`HUB_CLAVE_MAESTRA`**: guardarla fuera de Railway (gestor de contraseñas del PO). Si se pierde o cambia, las llaves guardadas no se pueden descifrar: hay que **rotar la llave de cada parroquia** y actualizar su `INTEROP_SECRET`.

## 7. Panel web (`/panel`)
- **Inicio:** consultas totales, pendientes, aprobadas, rechazadas, últimos 30 días y semáforo de cada parroquia (consulta su `/api/health`).
- **Parroquias:** registrar (la llave `INTEROP_SECRET` se muestra **una sola vez**), suspender/activar, generar llave nueva, editar nombre y URL.
- **Bitácora:** consultas por parroquia y estado. Nunca muestra el DNI (ni su hash).
- Seguridad: sesión firmada de 8 h (cookie HttpOnly, SameSite=Strict), 5 intentos fallidos en 15 min bloquean, anti-CSRF y cabeceras CSP/no-frame.

## 8. Administración por consola (alternativa al panel)
```bash
cd hub && pnpm instancia registrar <codigo> "<nombre>" https://<dominio>   # imprime INTEROP_SECRET una vez
cd hub && pnpm instancia listar
cd hub && pnpm instancia rotar <codigo>        # llave nueva; actualizar INTEROP_SECRET en la parroquia
cd hub && pnpm instancia desactivar <codigo>   # suspende (activar para revertir)
```
Dar de alta una parroquia completa: `docs/ALTA_NUEVA_PARROQUIA.md` en `master`.

## 9. Respaldos
La base del hub entra en el workflow diario de `master` (`.github/workflows/respaldos.yml`, base `hub`, secret `BACKUP_DB_URL_HUB`). Tablas verificadas: `instancia`, `solicitud`. Restauración de prueba: `./scripts/restaurar-prueba.sh hub` desde `master` (ver `docs/BACKUP_RESTORE_RUNBOOK.md`).
Sin `HUB_CLAVE_MAESTRA` un respaldo restaurado no sirve para reenviar consultas (ver §6).

## 10. Problemas frecuentes
| Síntoma | Causa | Solución |
|---|---|---|
| Railway construye Next.js | Servicio apuntando a `master` | Source → Branch = `hub` |
| "Error interno" al registrar parroquia | Falta `HUB_CLAVE_MAESTRA` | Cargarla y redeploy |
| Parroquia en rojo en el semáforo | Parroquia caída o URL mal registrada | Revisar su `/api/health`; editar la URL en el panel |
| Parroquia recibe 401 | Llave rotada sin actualizar o reloj desfasado | Copiar la llave nueva a `INTEROP_SECRET` y redeploy |
| `502` al crear o responder | La otra parroquia no responde | Revisar esa parroquia; la consulta queda en `error_envio` del lado del origen |
| Archivos compartidos distintos de `master` | Falta sincronizar | §1 |

## 11. Desarrollo y pruebas
```bash
cd hub && pnpm install
DATABASE_URL=postgresql://... pnpm dev
HUB_TEST_DATABASE_URL=postgresql://postgres:test@localhost:55432/christifideles_hub_test pnpm test
pnpm typecheck
```
Antes de un PR a `hub`: `pnpm test` y `pnpm typecheck` en verde y, si cambió algo visible, una línea en la Bitácora de `docs/PLAN_MULTIPARROQUIA.md` (en `master`).
