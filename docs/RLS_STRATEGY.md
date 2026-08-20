# Estrategia de Row Level Security (RLS) — ChristiFideles v1

Fecha: 2026-08-20
Fuente funcional: `docs/christi_fidelis_bdd_pg_v3.sql`
Estado: **Diseño aprobado — NO activar RLS en producción en Sprint 0**

## 1. Objetivo

El SQL v3 define políticas de Row Level Security para `persona`, los
sacramentos y `bitacora_crud`, usando el tenant de sesión
`current_setting('app.tenant_id')`. Este documento define **cómo** se
integrará esa RLS con Prisma + Neon **sin** activarla todavía, para
evitar fugas de datos o caídas por un mal manejo del pooling.

## 2. Modelo de defensa en dos capas

ChristiFideles v1 protege el tenant en **dos capas independientes**:

1. **Capa de aplicación (activa hoy).** Todas las rutas derivan
   `id_parroquia` de `session.user.parishId` y filtran explícitamente
   cada consulta Prisma por `id_parroquia`. Es la defensa primaria y ya
   está implementada y verificada (PR #7).
2. **Capa de base de datos (futura).** RLS en PostgreSQL como red de
   seguridad: aunque una consulta olvidara el filtro, la base impediría
   leer/escribir filas de otra parroquia.

La RLS **complementa**, no reemplaza, los filtros explícitos de Prisma.
Nunca se debe eliminar el filtro de aplicación confiando solo en RLS.

## 3. El problema: RLS + pooling + Prisma

RLS requiere que cada consulta se ejecute con el tenant correcto en una
variable de sesión de PostgreSQL:

```sql
SET LOCAL app.tenant_id = '<id_parroquia>';
```

`SET LOCAL` sólo vive dentro de una **transacción**. El riesgo real
aparece con **connection pooling**:

- **Neon / PgBouncer en modo `transaction`**: una conexión física se
  reutiliza entre distintos clientes. Un `SET` sin `LOCAL` (a nivel de
  sesión) **persistiría** en la conexión y podría filtrar el tenant de
  un request al siguiente. Esto es una fuga de datos crítica.
- **`SET LOCAL` fuera de una transacción** no tiene efecto: la política
  RLS vería `app.tenant_id` vacío y, según cómo se escriba la policy,
  bloquearía todo o (peor) no filtraría nada.

Por tanto, RLS sólo es seguro si **cada operación tenant-scoped corre
dentro de una transacción que hace `SET LOCAL` al inicio**.

## 4. Patrón de integración con Prisma

Toda operación protegida por RLS debe envolverse en
`prisma.$transaction`, fijando el tenant con `SET LOCAL` como primer
comando de la transacción:

```ts
async function withTenant<T>(
  parishId: number,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // Parametrizado para evitar inyección; SET LOCAL sólo aplica dentro de esta tx.
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${String(parishId)}, true)`;
    return fn(tx);
  });
}
```

Notas:
- Se usa `set_config(..., true)` (equivalente transaccional de `SET LOCAL`)
  en lugar de interpolar SQL, para no exponerse a inyección.
- El `parishId` **siempre** proviene de `session.user.parishId`, nunca
  del cliente.
- La lógica de negocio se ejecuta con el `tx` de la transacción, no con
  el `prisma` global, para garantizar que corre en la misma conexión.

## 5. Conexión a Neon

- Usar **dos URLs**: la *pooled* (PgBouncer, para la app en runtime) y
  la *direct* (para migraciones/`prisma migrate deploy`).
- Con el pooler en modo `transaction`, el patrón de la §4 es
  obligatorio: nunca `SET` a nivel de sesión.
- Las migraciones que crean policies RLS se aplican con la conexión
  **directa**.

## 6. Bosquejo de las políticas (migración SQL versionada)

Cuando se active (fuera de Sprint 0), se hará mediante migración SQL
versionada, no desde Prisma Schema (que no representa RLS):

```sql
ALTER TABLE persona ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona FORCE ROW LEVEL SECURITY;

CREATE POLICY persona_tenant_isolation ON persona
  USING (id_parroquia = current_setting('app.tenant_id')::int)
  WITH CHECK (id_parroquia = current_setting('app.tenant_id')::int);
```

Se replica para `bautismo`, `primera_comunion`, `confirmacion`,
`matrimonio`, `tr_persona_grupo_rol`, `sector_parroquial` y
`bitacora_crud`. El rol de aplicación **no** debe ser superusuario ni
`BYPASSRLS`.

## 7. Riesgos de fuga a vigilar

- Consultas fuera de `withTenant` (sin `SET LOCAL`) → la policy no ve el
  tenant. Mitigación: centralizar todo acceso tenant-scoped en el helper.
- Reutilización de conexión con estado residual → usar siempre
  `set_config(..., true)` transaccional, nunca `SET` de sesión.
- Rol de conexión con `BYPASSRLS` → prohibido para el rol de la app.
- `current_setting` inexistente lanza error; definir la clave o usar
  `current_setting('app.tenant_id', true)` con manejo explícito de nulo
  en la policy.

## 8. Plan de rollout (posterior a Sprint 0)

1. Crear el helper `withTenant` y migrar las rutas tenant-scoped a él.
2. Añadir migración SQL de policies **sólo en staging**.
3. Pruebas de aislamiento A/B con el pooler activo (incluida
   concurrencia) verificando que ninguna conexión filtra tenant.
4. Revisión de rendimiento (RLS añade predicados a cada consulta).
5. Activación gradual en producción, manteniendo los filtros explícitos
   de Prisma como primera capa.

## 9. Decisión para Sprint 0

- **No** se activa RLS en producción ni en CI en este sprint.
- La capa 1 (filtros Prisma por `id_parroquia` desde sesión) es la
  defensa vigente y suficiente para el piloto.
- Este documento es el contrato para la implementación futura de la
  capa 2.

## Regla para agentes IA

No activar RLS ni ejecutar `SET`/`SET LOCAL` en rutas productivas sin
seguir el patrón de la §4. Nunca eliminar el filtro explícito de
`id_parroquia` en Prisma confiando únicamente en RLS.
