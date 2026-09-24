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

## Estado

Leyenda: ✅ hecho · 🟡 en curso · ⬜ pendiente

### Fase 1 — Instancia por parroquia · rama `feature/fase1-instancia-por-parroquia`
- ✅ `src/lib/instancia-env.ts`: `leerParroquiaDesdeEnv`, `leerCodigoInstancia` (puras, sin Prisma)
- ✅ `src/lib/instancia.ts`: `getInstanciaInfo()`
- ✅ `GET /api/instancia` (pública, sin datos sensibles): `{ codigo, nombre, version }`
- ✅ `prisma/seed.ts` toma la parroquia de `PARROQUIA_*` (fallback: Cristo Resucitado)
- ✅ `tests/instancia.test.ts`
- ✅ Docs: `docs/RAILWAY_DEPLOYMENT.md` §3.1 y `.env.example`
- ⬜ Correr `tests/instancia.test.ts` contra una BD de test (en local falta `TEST_DATABASE_URL`)
- ⬜ Crear los dos servicios en Railway con sus variables (lo hace el PO)

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

### Fase 4 — Interoperabilidad (hub)
- ⬜ Confirmar D5 y D7
- ⬜ Hub: registro de instancias (código, URL, clave), log de solicitudes
- ⬜ Auth entre servicios con HMAC (API key por instancia)
- ⬜ Instancia: bandeja de notificaciones, aprobar o rechazar, respuesta de solo lectura
- ⬜ Tests de aislamiento: sin aprobación no sale ningún dato

## Instrucciones para agentes

1. Lee `AGENTS.md` y este documento. Las reglas de `AGENTS.md` siguen aplicando (DNI obligatorio, sin `id_persona`, auditoría, etc.).
2. Trabaja **una sola casilla o fase por rama**. Ramas: `feature/faseN-<descripcion>`.
   **Cada agente trabaja en su propio `git worktree`** (`git worktree add ../sacramentos-<rama> <rama>`). Nunca cambies de rama, hagas `reset`/`stash` ni commits en la carpeta de otro agente: dos agentes en la misma carpeta se pisan el trabajo (ya pasó el 2026-09-24).
3. **No leas ni modifiques `.env`** ni ningún archivo de secretos. No uses `sudo`, `docker` ni rutas fuera del repo.
4. No toques `prisma/schema.prisma` ni migraciones salvo que la casilla lo pida. Si lo pide, crea una migración versionada (nunca `db push`).
5. Verifica antes de reportar: `pnpm exec tsc --noEmit`, `pnpm lint` y los tests del área (necesitan `TEST_DATABASE_URL` apuntando a una BD `*_test`).
6. **No hagas commits ni push**: el revisor (Claude) revisa el diff y hace el commit.
7. Al terminar, actualiza **Estado** (✅/🟡) y agrega una entrada en **Bitácora**: fecha, agente/modelo, qué hiciste, qué quedó pendiente y cómo verificarlo. Si algo falló, dilo tal cual.
8. Ante una duda que afecte la integridad sacramental, la seguridad o el aislamiento entre parroquias: detente y déjala anotada en la Bitácora para el PO.

## Bitácora

| Fecha | Agente | Qué se hizo | Pendiente / notas |
|-------|--------|-------------|-------------------|
| 2026-09-24 | Claude (Opus 5.5) | Plan y decisiones. Fase 1 implementada: seed por env, `/api/instancia`, tests y docs. | Tests de ruta sin ejecutar en local (falta `TEST_DATABASE_URL`); la lógica pura se validó aparte. Intentos de delegar a Gemini (cuota gratuita sin Pro) y MiniMax M3 (salió del repo: docker/sudo) fallaron sin dejar cambios. Otra sesión opencode en la misma carpeta metió estos archivos en su commit y luego hizo reset; se recuperaron desde `13ecf37` al worktree `../sacramentos_christifideles-fase1`. |
| 2026-09-24 | Claude (Opus 5.5) | Fase 1 rebaseada sobre `master` (PR #31 mergeado). Fase 2: resumen de sacramentos en `GET /api/personas`, filtros e insignias en el listado, acceso al expediente. | Falta correr los tests de API con BD de test y hacer `pnpm build` completo. Pendiente: insignias en `/buscar`. |
| 2026-09-24 | Claude (Opus 5.5) | El PO difiere la Fase 3 (gestor de expedientes) a v2. La v1 es el registro de sacramentos. | Por confirmar: si la Fase 4 (interoperabilidad) entra en v1. |
