# Historia de migraciones Prisma — v1

## Secuencia reproducible desde BD vacía

`prisma migrate deploy` aplica las migraciones en orden lexicográfico:

1. `20260922004338_init` — crea el esquema completo desde cero. Bautismo con
   `numero_identidad_madrina` y `numero_identidad_padrino` **NOT NULL**
   (representa el estado anterior al cambio funcional v1).
2. `20260922004339_bautismo_padrino_madrina_opcional` — delta:
   - `ALTER COLUMN ... DROP NOT NULL` (hace padrino/madrina opcionales)
   - `ADD CONSTRAINT bautismo_padrino_o_madrina_chk CHECK (...)`
     alineado con `docs/christi_fidelis_bdd_pg_v3.sql` (usa `NULLIF + BTRIM`
     para que strings vacíos o con espacios NO cuenten como padrino/madrina).

## Validación CI

`ChristiFideles CI` levanta un PostgreSQL 16 efímero y ejecuta:

1. `pnpm exec prisma migrate deploy` (BD vacía → schema actual)
2. `NODE_ENV=test pnpm db:seed`
3. `NODE_ENV=test pnpm db:seed:verify:ci` (verifica baseline + idempotencia + hash)
4. `pnpm run lint`
5. `pnpm test` (256 tests)
6. `pnpm run build`

## Manejo de una BD existente (con `db push` o SQL manual previo)

Si la BD de staging/producción ya tiene el schema creado por `prisma db push`
o por SQL manual y NO tiene historial de migraciones Prisma, las migraciones
no se aplicarán automáticamente (Prisma no sabrá que ya están "aplicadas").

**Procedimiento manual (NO ejecutar desde este repo sin supervisión):**

```bash
# 1. Marcar la baseline como ya aplicada (porque el schema ya existe)
pnpm exec prisma migrate resolve --applied 20260922004338_init

# 2. Marcar el delta (si el schema actual ya tiene padrino/madrina opcional + CHECK)
pnpm exec prisma migrate resolve --applied 20260922004339_bautismo_padrino_madrina_opcional

# 3. Verificar estado
pnpm exec prisma migrate status
```

**Cuándo NO usar `migrate resolve`:**

- Si la BD NO tiene las tablas del baseline → `migrate deploy` debe correr
  desde cero, no usar resolve.
- Si la BD tiene el schema pero NO tiene el CHECK de padrino/madrina →
  ejecutar manualmente el SQL del delta antes de hacer resolve.

**Verificación post-resolve:**

```sql
-- En la BD:
SELECT conname FROM pg_constraint
 WHERE conname = 'bautismo_padrino_o_madrina_chk';
-- Debe devolver 1 fila.

SELECT is_nullable
  FROM information_schema.columns
 WHERE table_name = 'bautismo'
   AND column_name IN ('numero_identidad_madrina', 'numero_identidad_padrino');
-- Ambas deben devolver 'YES'.
```

## Estado actual

- ✅ Migraciones aplicables desde BD vacía
- ✅ Seed reproducible
- ✅ CI valida pipeline completo
- ✅ Schema.prisma alineado con estado final (nullable)
- ✅ v3 SQL (fuente de verdad funcional) preservado sin cambios
