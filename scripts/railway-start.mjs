/**
 * Arranque en Railway:
 * 1) aplica migraciones versionadas;
 * 2) aplica catálogos comunes (departamentos, municipios, roles…) en CADA arranque;
 * 3) inicializa parroquia y admin solo si no existen usuarios;
 * 4) arranca Next.js en 0.0.0.0:PORT.
 */
import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL es obligatoria en Railway.');
  process.exit(1);
}

run('pnpm exec prisma migrate deploy');
// Idempotente: así las instancias ya inicializadas reciben catálogos nuevos.
run('pnpm db:seed:catalogos');

const prisma = new PrismaClient();

try {
  const userCount = await prisma.usuario.count();

  if (userCount === 0) {
    if (!process.env.SEED_SUPERADMIN_EMAIL || !process.env.SEED_SUPERADMIN_PASSWORD) {
      throw new Error(
        'La base está vacía y requiere SEED_SUPERADMIN_EMAIL y SEED_SUPERADMIN_PASSWORD para inicializarse.'
      );
    }

    console.log('Base sin usuarios. Ejecutando seed inicial...');
    run('pnpm db:seed');

    const seededUserCount = await prisma.usuario.count();
    if (seededUserCount === 0) {
      throw new Error('El seed inicial terminó pero no creó ningún usuario.');
    }

    console.log(`Seed inicial completado. Usuarios disponibles: ${seededUserCount}`);
  } else {
    console.log(`Seed inicial omitido: ya existen ${userCount} usuario(s).`);
  }
} finally {
  await prisma.$disconnect();
}

const port = process.env.PORT || '3000';
run(`pnpm exec next start -H 0.0.0.0 -p ${port}`);
