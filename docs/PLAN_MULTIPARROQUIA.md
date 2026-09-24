# Plan multiparroquia — instancias independientes, expedientes e interoperabilidad

> **Documento vivo de traspaso.** Cualquier agente IA (Claude, Gemini, MiniMax, etc.)
> que trabaje en esta iniciativa DEBE leerlo antes de empezar y DEBE actualizar la
> sección [Estado](#estado) y la [Bitácora](#bitácora) al terminar su sesión,
> aunque haya dejado el trabajo a medias.

- **PO:** Luis Martinez · **PM/revisor:** Claude
- **Meta de lanzamiento:** noviembre–diciembre 2026
- **Piloto:** Cristo Resucitado de Loarque y Salvador del Mundo de Cerro Grande (Tegucigalpa, municipio `0801`)

## Arquitectura objetivo

```
Railway
├── Instancia "cristo-resucitado"   (este repo)  + PostgreSQL propio
├── Instancia "salvador-del-mundo"  (este repo)  + PostgreSQL propio
└── Hub central (hub/ en este repo)              + PostgreSQL propio
      └── solo registro de parroquias + log de solicitudes (NUNCA datos sacramentales)
```

Capas (de abajo hacia arriba): **Gestor de expedientes** → **Esquema de
interoperabilidad** → **Seguridad**.

## Decisiones tomadas (no re-discutir sin el PO)

| # | Decisión |
|---|----------|
| D1 | **Cada parroquia tiene su BD independiente.** Prohibido compartir BD o conectarse a la BD de otra instancia. |
| D2 | Mismo código para todas las instancias; la identidad sale de variables de entorno (`PARROQUIA_*`). |
| D3 | Se conserva `id_parroquia` en el esquema (evita reescribir tablas). Dentro de cada BD tiene un único valor. |
| D4 | Interoperabilidad **solo de consulta**, vía API y a través del hub. Ninguna instancia escribe en otra. |
| D5 | Las solicitudes entre parroquias se notifican y **se aprueban manualmente** en la parroquia que recibe la solicitud. *(recomendado; pendiente de confirmar por el PO)* |
| D6 | Gestor de expedientes y escaneos: **fuera de v1**, pasa a v2. Almacenamiento a decidir entonces (R2 recomendado). |
| D7 | El hub vive en este repo, carpeta `hub/`. *(recomendado; pendiente de confirmar)* |

## Roles (decisión del PO, 2026-09-24)

| Rol | Sacramentos | Consultas entre parroquias |
|-----|-------------|----------------------------|
| **Secretaria** | Registra y **edita**; no borra ni da de baja | Puede consultar, **no** aprobar |
| **Párroco** | Ve todo y autoriza todo (`fullAccess`, incluidos usuarios y configuración) | Consulta y aprueba |

- **Toda modificación de un sacramento exige justificación** (10 a 500 caracteres), para todos los roles. Se valida en el backend (`src/lib/justificacion.ts`) y queda en `bitacora_crud.new_values.justificacion`. El formulario la pide al guardar (`pedirJustificacion`).

## Estado

Leyenda: ✅ hecho · 🟡 en curso · ⬜ pendiente

### Fase 1 — Instancia por parroquia · rama `feature/fase1-instancia-por-parroquia`
- ✅ `src/lib/instancia-env.ts`: `leerParroquiaDesdeEnv`, `leerCodigoInstancia` (puras, sin Prisma)
- ✅ `src/lib/instancia.ts`: `getInstanciaInfo()`
- ✅ `GET /api/instancia` (pública, sin datos sensibles): `{ codigo, nombre, version }`
- ✅ `prisma/seed.ts` toma la parroquia de `PARROQUIA_*` (fallback: Cristo Resucitado)
- ✅ `tests/instancia.test.ts`
- ✅ Docs: `docs/RAILWAY_DEPLOYMENT.md` §3.1 y `.env.example`
- ✅ `tests/instancia.test.ts` pasa contra la BD de test
- ⬜ Crear los tres servicios en Railway (dos parroquias y el hub) siguiendo `docs/RAILWAY_DEPLOYMENT.md` §16 (lo hace el PO)

### Fase 2 — Sacramentos en el módulo Personas · rama `feature/fase2-sacramentos-en-personas` (apilada sobre fase 1)
- ✅ Resumen por persona sin vista SQL: `_count` de Prisma (`personaSacramentosCount`, `resumenSacramentos`, `whereSacramento` en `src/lib/persona.ts`). No requiere migración. Si con volumen real se vuelve lento, pasar a vista `v_persona_sacramentos`.
- ✅ `GET /api/personas` devuelve `sacramentos: { bautismo, primera_comunion, confirmacion, matrimonio }` y acepta `?sacramento=` / `?sin_sacramento=`
- ✅ Listado de personas: columna con insignias B / PC / C / M, filtro "Con / Sin <sacramento>" y botón al expediente
- ✅ Detalle con línea de tiempo: ya existía en `/personas/[id]/expediente` (`src/lib/expediente.ts`)
- ✅ Tests en `tests/personas.test.ts` (lógica pura validada; los de API siguen pendientes de `TEST_DATABASE_URL`)
- ⬜ La búsqueda global (`/buscar`, `src/lib/busqueda.ts`) todavía no muestra insignias
- ⬜ Solo cuenta a la persona como sujeto principal (bautizado, comulgante, confirmado, cónyuge), no como padrino ni como padre o madre

### Fase 3 — Gestor de expedientes (escaneos) · **DIFERIDA A v2** (decisión del PO, 2026-09-24)

> La v1 se enfoca en el registro de sacramentos. No implementar esta fase hasta que el PO la reactive.

- ⬜ Confirmar D6 (almacenamiento)
- ⬜ Modelo `Documento` + catálogo `TipoDocumento` + requisitos por sacramento (migración; alinear con `docs/christi_fidelis_bdd_pg_v3.sql`)
- ⬜ Subida (URL firmada), visualización y checklist de requisitos
- ⬜ Auditoría de subida y eliminación

### Fase 4 — Interoperabilidad (hub) · **ENTRA EN v1, es el diferenciador** · rama `feature/fase4-interoperabilidad`

#### Diseño

```
Parroquia A (solicita)          Hub central                 Parroquia B (responde)
──────────────────────          ───────────                 ──────────────────────
1. Usuario crea consulta ──▶ 2. Registra y reenvía ──▶ 3. Aparece en la bandeja
   (DNI + motivo)               (sin datos sacramentales)      de notificaciones
                                                         4. Un usuario aprueba o rechaza
6. Ve la respuesta     ◀── 5. Reenvía la respuesta ◀──     (si aprueba se arma la respuesta)
   (solo lectura)               y NO la guarda
```

- **Hub** (`hub/`, app Next.js mínima con su propio Prisma y Postgres): tabla `instancia` (código, URL, secreto, activa) y tabla `solicitud` (uuid, origen, destino, estado y fechas). **Nunca guarda el DNI en claro ni la respuesta**: guarda el hash SHA-256 del DNI, solo para auditoría.
- **Instancia** (esta app): tabla `solicitud_interop` con `direccion` `S` (saliente) o `E` (entrante). Endpoints:
  - `POST /api/interop/solicitudes` (usuario): crea la saliente y la envía al hub
  - `GET /api/interop/solicitudes?direccion=` (usuario): bandejas
  - `POST /api/interop/solicitudes/[id]/resolver` (usuario): aprobar o rechazar una entrante
  - `POST /api/interop/entrantes` (solo el hub, firmado): recibe una solicitud
  - `POST /api/interop/respuestas` (solo el hub, firmado): recibe una respuesta
- **Autenticación entre servicios:** HMAC-SHA256 con un secreto compartido entre cada instancia y el hub. Cabeceras `x-interop-instancia`, `x-interop-timestamp` y `x-interop-firma`. La firma cubre `timestamp\nMETHOD\npath\nbody`. Se rechaza un desfase mayor a 5 minutos y la comparación se hace en tiempo constante.
- **Variables de la instancia:** `INTEROP_HUB_URL`, `INTEROP_SECRET` y `PARROQUIA_CODIGO` (Fase 1).
- **Datos que se comparten al aprobar** (ajustable por el PO): nombres, apellidos, fecha de nacimiento y, por cada sacramento como sujeto principal, tipo, fecha, libro, página, registro y folio. **Nunca** teléfono, email, dirección ni datos de padres o padrinos.
- **Estados:** `pendiente` → `aprobada` o `rechazada`. Si falla la entrega: `error_envio`.
- **Auditoría:** cada creación y cada resolución se registra en `bitacora_crud`.

#### Casillas
- ✅ D5 aprobación manual y D7 hub en `hub/` (asumidas con el OK del PO)
- ✅ 4a. `src/lib/interop/firma.ts` (firmar y verificar) + `tests/interop-firma.test.ts` (5/5, pura)
- ✅ 4b. Modelo `SolicitudInterop`, migración `20260925090000_solicitud_interop` (con CHECK de dirección y estado) y alineación con `docs/christi_fidelis_bdd_pg_v3.sql`. Migración generada con `prisma migrate diff`, **sin aplicar todavía a ninguna BD**
- ✅ 4c. Endpoints de la instancia (`src/app/api/interop/*`, `src/lib/interop/{cliente,contrato,respuesta,solicitudes}.ts`) + `tests/interop.test.ts` (13). Permisos nuevos: `canSolicitarInterop` (admin, párroco, clero, secretario) y `canResolverInterop` (admin, párroco, clero; **no** secretario, ajustable por el PO). Las entrantes y respuestas que llegan del hub no generan `bitacora_crud` (no hay usuario); la fila de `solicitud_interop` es la traza
- ✅ 4d. `hub/`: servidor Node mínimo (`node:http` con handlers Request/Response, sin framework) + Prisma propio (`instancia`, `solicitud`), secretos HMAC cifrados con AES-256-GCM (`HUB_CLAVE_MAESTRA`), CLI `pnpm instancia registrar|rotar|activar|desactivar|listar`, `hub/railway.toml` y `hub/tests/hub.test.ts` (10). El hub no guarda motivo, DNI en claro ni respuestas
  - Tests del hub: `cd hub && HUB_TEST_DATABASE_URL=postgresql://postgres:test@localhost:55432/christifideles_hub_test pnpm test` (crear antes la BD y correr `prisma migrate deploy`)
  - ⚠️ Verificar en el primer deploy que Nixpacks respeta `hub/railway.toml` con Root Directory vacío
- ✅ 4e. UI `/consultas`: nueva consulta (con `?dni=` precargado desde el expediente), pestañas "Mis consultas" y "Recibidas", aprobar (el diálogo explica qué se comparte) o rechazar (con motivo), ver la respuesta. Entrada en el menú con contador de pendientes y botón "Consultar en otra parroquia" en el expediente. Los datos remotos se escapan antes de meterlos en HTML
- ✅ **Prueba E2E real** (2026-09-24): hub y dos instancias `next start`, cada una con su Postgres. Flujo A→hub→B→aprobar→hub→A OK. Verificado: el hub no guarda el DNI en claro, B no guarda la respuesta, A no recibe el teléfono, queda bitácora en B y las llamadas con firma falsa dan 401
- ✅ 4f. Runbook en `docs/RAILWAY_DEPLOYMENT.md` §16 (tres servicios, registro, variables, rotación y suspensión) y `.env.example`

## Instrucciones para agentes

1. Lee `AGENTS.md` y este documento. Las reglas de `AGENTS.md` siguen aplicando (DNI obligatorio, sin `id_persona`, auditoría, etc.).
2. Trabaja **una sola casilla o fase por rama**. Ramas: `feature/faseN-<descripcion>`.
   **Cada agente trabaja en su propio `git worktree`** (`git worktree add ../sacramentos-<rama> <rama>`). Nunca cambies de rama, hagas `reset`/`stash` ni commits en la carpeta de otro agente: dos agentes en la misma carpeta se pisan el trabajo (ya pasó el 2026-09-24).
3. **No leas ni modifiques `.env`** ni ningún archivo de secretos. No uses `sudo`, `docker` ni rutas fuera del repo.
4. No toques `prisma/schema.prisma` ni migraciones salvo que la casilla lo pida. Si lo pide, crea una migración versionada (nunca `db push`).
5. Verifica antes de reportar: `pnpm exec tsc --noEmit`, `pnpm lint` y los tests. BD de test desechable:
   ```bash
   docker run -d --name christifideles-test-db -e POSTGRES_PASSWORD=test -e POSTGRES_DB=christifideles_test -p 127.0.0.1:55432:5432 postgres:16-alpine
   export TEST_DATABASE_URL=postgresql://postgres:test@localhost:55432/christifideles_test
   DATABASE_URL=$TEST_DATABASE_URL pnpm exec prisma migrate deploy && pnpm test
   ```
6. **No hagas commits ni push**: el revisor (Claude) revisa el diff y hace el commit.
7. Al terminar, actualiza **Estado** (✅/🟡) y agrega una entrada en **Bitácora**: fecha, agente/modelo, qué hiciste, qué quedó pendiente y cómo verificarlo. Si algo falló, dilo tal cual.
8. Ante una duda que afecte la integridad sacramental, la seguridad o el aislamiento entre parroquias: detente y déjala anotada en la Bitácora para el PO.

## Bitácora

| Fecha | Agente | Qué se hizo | Pendiente / notas |
|-------|--------|-------------|-------------------|
| 2026-09-24 | Claude (Opus 5.5) | Plan y decisiones. Fase 1 implementada: seed por env, `/api/instancia`, tests y docs. | Tests de ruta sin ejecutar en local (falta `TEST_DATABASE_URL`); la lógica pura se validó aparte. Intentos de delegar a Gemini (cuota gratuita sin Pro) y MiniMax M3 (salió del repo: docker/sudo) fallaron sin dejar cambios. Otra sesión opencode en la misma carpeta metió estos archivos en su commit y luego hizo reset; se recuperaron desde `13ecf37` al worktree `../sacramentos_christifideles-fase1`. |
| 2026-09-24 | Claude (Opus 5.5) | Fase 1 rebaseada sobre `master` (PR #31 mergeado). Fase 2: resumen de sacramentos en `GET /api/personas`, filtros e insignias en el listado, acceso al expediente. | Falta correr los tests de API con BD de test y hacer `pnpm build` completo. Pendiente: insignias en `/buscar`. |
| 2026-09-24 | Claude (Opus 5.5) | El PO difiere la Fase 3 (gestor de expedientes) a v2. La v1 es el registro de sacramentos. | Por confirmar: si la Fase 4 (interoperabilidad) entra en v1. |
| 2026-09-24 | Claude (Opus 5.5) | El PO confirma que la interoperabilidad entra en v1. Diseño en el plan. 4a (firma HMAC), 4b (tabla y migración) y 4c (endpoints de la instancia y permisos) hechos. Suite completa: 355/355 contra el Postgres desechable en Docker. | Siguiente: 4d (app `hub/`), luego 4e (UI) y 4f (despliegue). |
| 2026-09-24 | Claude (Opus 5.5) | 4d: hub listo con 10/10 tests. `hub/` queda excluido del tsc de la raíz; el lint de la raíz sí lo revisa (sin warnings nuevos). | Siguiente: 4e (UI de consultas y bandeja). |
| 2026-09-24 | Claude (Opus 5.5) | 4e: UI de consultas. `pnpm build` OK. E2E real con tres servidores y tres BDs OK (detalle en Estado). | UI no revisada visualmente en navegador. Siguiente: 4f (runbook de despliegue). |
| 2026-09-24 | Claude (Opus 5.5) | 4f: runbook de despliegue. **Fase 4 completa.** App 355+ tests y hub 10 tests en verde. | Pendiente del PO: crear los servicios en Railway, revisar la UI en navegador y confirmar los permisos (hoy el secretario puede consultar pero no aprobar). |
| 2026-09-24 | Claude (Opus 5.5) | Roles: la secretaria puede editar sacramentos (sin borrar), el párroco pasa a acceso total y la justificación es obligatoria al editar (backend, UI y auditoría). 358/358 tests. | Por confirmar con el PO: la secretaria sigue sin poder crear ni editar Personas (`canManagePersonas`). |
| 2026-09-24 | Claude (Opus 5.5) | Seed completo por instancia: 18 departamentos y 298 municipios (`prisma/catalogos/honduras.ts`, códigos oficiales DDMM), 9 roles alineados con los permisos (`prisma/catalogos/roles.ts`, con test). Las personas de QA con DNI ficticio quedan solo para dev/test. Se eliminó el asistente `/setup` y `ALLOW_INITIAL_SETUP`: cada instancia se inicializa en su deploy. | Los nombres de municipio van sin tildes (como en la fuente); corregir a mano si el PO lo pide. |
| 2026-09-24 | Claude (Opus 5.5) | Bug en Railway: las instancias con usuarios no recibían el catálogo, porque el seed completo solo corre con la BD vacía (log: "Seed inicial omitido"). Ahora `railway-start` corre `pnpm db:seed:catalogos` (idempotente) en cada arranque, y el seed completo (parroquia y admin) sigue solo para BD vacía. `openssl` agregado al Dockerfile. | Verificar en el próximo deploy que el log muestra "✓ Catálogos aplicados". |
