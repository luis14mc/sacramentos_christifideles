# Row Level Security (RLS) — activación en Neon/PostgreSQL
#
# 1. Ejecutar el script SQL en la base de datos de producción/staging:
#    psql $DATABASE_URL -f docs/migracion_rls_v6.sql
#
# 2. En Vercel (o .env local), activar:
#    DATABASE_RLS_ENABLED=true
#
# 3. La app usa withTenantScope() para SET app.tenant_id por transacción.
#    Sin la variable en "true", el aislamiento sigue siendo por código (id_parroquia).
#
# Verificación post-migración:
#   npm run verify:rls
