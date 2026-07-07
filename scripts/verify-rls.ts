/**
 * Verifica que RLS esté activo en PostgreSQL.
 * Uso: npx tsx scripts/verify-rls.ts
 * Requiere DATABASE_URL y que se haya ejecutado docs/migracion_rls_v6.sql
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tables = [
    'persona',
    'bautismo',
    'primera_comunion',
    'confirmacion',
    'matrimonio',
    'bitacora_crud',
    'sector_parroquial',
  ];

  console.log('Verificando Row Level Security...\n');

  for (const table of tables) {
    const rows = await prisma.$queryRawUnsafe<
      { relrowsecurity: boolean }[]
    >(
      `SELECT relrowsecurity FROM pg_class WHERE relname = $1 AND relkind = 'r'`,
      table
    );
    const enabled = rows[0]?.relrowsecurity === true;
    console.log(`${enabled ? '✓' : '✗'} ${table}: RLS ${enabled ? 'activo' : 'INACTIVO'}`);
  }

  const fn = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS(
      SELECT 1 FROM pg_proc WHERE proname = 'app_current_tenant_id'
    ) AS exists
  `;
  console.log(
    `\n${fn[0]?.exists ? '✓' : '✗'} Función app_current_tenant_id: ${fn[0]?.exists ? 'presente' : 'AUSENTE'}`
  );

  console.log(
    '\nSi algún ítem falla, ejecute: psql $DATABASE_URL -f docs/migracion_rls_v6.sql'
  );
  console.log('Luego active DATABASE_RLS_ENABLED=true en el entorno de la app.');
}

main()
  .catch((e) => {
    console.error('Error verificando RLS:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
