# ChristiFideles

Sistema de registro sacramental para parroquias de Honduras: personas, bautismos, primeras comuniones, confirmaciones y matrimonios, con libros y numeración, constancias en PDF, auditoría y consultas entre parroquias.

**Estado:** en producción con dos parroquias piloto (Tegucigalpa) desde octubre de 2026. Ver [`docs/ESTADO_PROYECTO.md`](docs/ESTADO_PROYECTO.md).

## Arquitectura en una vista

```
 Parroquia A (Railway)          Centralizador / hub (Railway)        Parroquia B (Railway)
 app Next.js  ─┐                 rama `hub`                       ┌─ app Next.js
 Postgres A    │  consulta firmada (HMAC) ──►  reenvía + bitácora ──►│  Postgres B
               └◄─ respuesta (solo si B la aprueba) ◄─────────────────┘
```

- **Una instancia y una base de datos por parroquia.** Ninguna parroquia lee la base de otra.
- **El centralizador** solo reenvía consultas y guarda una bitácora sin datos personales (el DNI va como huella irreversible). Vive en la rama `hub`.
- La rama `master` es el software de las parroquias.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Prisma 6 + PostgreSQL · NextAuth 4 · Tailwind + DaisyUI · pdf-lib · Vitest · pnpm 10 · Node ≥ 20 · Railway.

## Desarrollo local

```bash
git clone https://github.com/luis14mc/sacramentos_christifideles.git
cd sacramentos_christifideles
pnpm install
cp .env.example .env.local      # completar DATABASE_URL, NEXTAUTH_SECRET (32+ caracteres), etc.
pnpm prisma migrate deploy      # aplica prisma/migrations
pnpm db:seed                    # parroquia, catálogos y admin (solo dev/test)
pnpm dev                        # http://localhost:3000
```

Pruebas: definir `TEST_DATABASE_URL` (base desechable) y correr `pnpm test`. Lint: `pnpm lint`. Build: `pnpm build`.

| Script | Para qué |
|---|---|
| `pnpm db:seed:catalogos` | Departamentos, municipios y roles (idempotente; corre en cada arranque en Railway) |
| `pnpm admin:general` | Crea el admin general si no existe (`ADMIN_GENERAL_PASSWORD`) |
| `pnpm admin:crear` | Crear un admin de emergencia |
| `pnpm db:reset:dev` | Reiniciar la base local (requiere `ALLOW_DB_RESET`; nunca en producción) |
| `pnpm smoke` | Pruebas de humo contra `BASE_URL` |

## Estructura

```
prisma/            schema, migraciones versionadas, seeds y catálogos de Honduras
src/app/           páginas (App Router) y API (src/app/api)
src/lib/           lógica de dominio: sacramentos, constancias, permisos, interop
src/components/    componentes de UI
tests/             pruebas Vitest (contra Postgres real)
scripts/           arranque en Railway, admins, restauración de prueba
docs/              documentación (índice en docs/README.md)
.github/workflows  CI y respaldos automáticos diarios
```

## Documentación

Empieza por [`docs/README.md`](docs/README.md). Lo más usado:

- Operar el sistema (secretaría y párroco): [`docs/MANUAL_USUARIO.md`](docs/MANUAL_USUARIO.md)
- Desplegar: [`docs/RAILWAY_DEPLOYMENT.md`](docs/RAILWAY_DEPLOYMENT.md) · Alta de parroquia: [`docs/ALTA_NUEVA_PARROQUIA.md`](docs/ALTA_NUEVA_PARROQUIA.md)
- Reglas para agentes IA y colaboradores: [`AGENTS.md`](AGENTS.md)

## Cómo contribuir

Equipo: el PO (Luis Martinez) aprueba y revisa; los agentes IA desarrollan. Reglas completas en [`AGENTS.md`](AGENTS.md).

1. Rama desde `master`: `feature/…`, `fix/…`, `docs/…` (o desde `hub` para el centralizador).
2. Commits `<tipo>(<modulo>): <descripcion>`.
3. `pnpm lint`, `pnpm test` y `pnpm build` en verde.
4. Actualizar la Bitácora de `docs/PLAN_MULTIPARROQUIA.md` y el `CHANGELOG.md`.
5. Pull Request; el PO aprueba el merge.

## Licencia

Uso privado de las parroquias participantes. Definir licencia formal antes de distribuir a terceros.
