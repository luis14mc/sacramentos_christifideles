import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcryptjs';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('CI seed verification requires DATABASE_URL.');

const parsedUrl = new URL(databaseUrl);
if (parsedUrl.hostname !== 'localhost' && parsedUrl.hostname !== '127.0.0.1') {
  throw new Error('CI seed verification is restricted to localhost PostgreSQL.');
}

const prisma = new PrismaClient();

async function counts() {
  return {
    parroquia: await prisma.parroquia.count({
      where: { nombre: 'Cristo Resucitado de Loarque' },
    }),
    usuario: await prisma.usuario.count({
      where: { email: 'admin@cristoresucitado.org' },
    }),
    sector: await prisma.sectorParroquial.count({
      where: {
        nombre: 'General',
        parroquia: { nombre: 'Cristo Resucitado de Loarque' },
      },
    }),
    rangos: await prisma.rangoOrdenSacerdotal.count({
      where: { nombre: { in: ['Diácono', 'Sacerdote', 'Obispo'] } },
    }),
    ordenes: await prisma.ordenReligiosa.count({
      where: { nombre: { in: ['Diocesano', 'Salesiano'] } },
    }),
  };
}

async function main() {
  const firstRun = await counts();
  if (
    firstRun.parroquia < 1 ||
    firstRun.usuario < 1 ||
    firstRun.sector < 1 ||
    firstRun.rangos < 3 ||
    firstRun.ordenes < 2
  ) {
    throw new Error('The first CI seed did not create the required baseline.');
  }

  const secondSeed = spawnSync('pnpm', ['db:seed'], {
    env: { ...process.env, NODE_ENV: 'test' },
    stdio: 'inherit',
  });
  if (secondSeed.error || secondSeed.status !== 0) {
    throw new Error('The second CI seed execution failed.');
  }

  const secondRun = await counts();
  if (JSON.stringify(secondRun) !== JSON.stringify(firstRun)) {
    throw new Error('The second CI seed execution created duplicate baseline records.');
  }

  const user = await prisma.usuario.findUniqueOrThrow({
    where: { email: 'admin@cristoresucitado.org' },
  });
  const passwordMatches = await compare(
    'Admin1234',
    Buffer.from(user.contrasena).toString('utf8'),
  );
  if (!passwordMatches) throw new Error('The seeded Super Admin hash is not authenticatable.');

  console.log('CI seed verification passed: baseline, idempotency, and authentication hash.');
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'CI seed verification failed.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
