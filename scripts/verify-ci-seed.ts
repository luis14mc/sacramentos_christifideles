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
const PERSONAS_QA = [
  ['0801-1990-00001', 'Juan Carlos', 'Martínez', 'M', 1, 1990],
  ['0801-1985-00002', 'José Antonio', 'López', 'M', 1, 1985],
  ['0801-1970-00003', 'Miguel Ángel', 'Rodríguez', 'M', 1, 1970],
  ['0801-1992-00004', 'María Fernanda', 'García', 'F', 1, 1992],
  ['0801-1960-00005', 'Pedro', 'Hernández', 'M', 0, 1960],
  ['0801-1995-00006', 'Carlos', 'Mejía', 'M', 1, 1995],
] as const;

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
    personasQa: await prisma.persona.count({
      where: {
        parroquia: { nombre: 'Cristo Resucitado de Loarque' },
        numero_identidad: { in: PERSONAS_QA.map(([dni]) => dni) },
      },
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
    firstRun.ordenes < 2 ||
    firstRun.personasQa !== PERSONAS_QA.length
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

  const parish = await prisma.parroquia.findFirstOrThrow({
    where: { nombre: 'Cristo Resucitado de Loarque' },
    orderBy: { id_parroquia: 'asc' },
  });
  const personas = await prisma.persona.findMany({
    where: {
      id_parroquia: parish.id_parroquia,
      numero_identidad: { in: PERSONAS_QA.map(([dni]) => dni) },
    },
    include: { sector: true, orden_religiosa: true, municipio_nacimiento: true },
  });
  for (const [dni, nombres, apellidos, sexo, estadoVital, year] of PERSONAS_QA) {
    const persona = personas.find((item) => item.numero_identidad === dni);
    if (
      !persona || persona.nombres !== nombres || persona.apellidos !== apellidos ||
      persona.sexo !== sexo || persona.estado_vital !== estadoVital ||
      persona.fecha_nacimiento.getUTCFullYear() !== year || !persona.telefono ||
      !persona.direccion || persona.estado_activo_parroquia !== 1 ||
      persona.sector.nombre !== 'General' || persona.orden_religiosa.nombre !== 'Diocesano' ||
      persona.municipio_nacimiento.nombre_municipio !== 'Distrito Central'
    ) {
      throw new Error(`Seeded QA Persona does not match the required profile: ${dni}.`);
    }
  }
  const clericalRows = await prisma.ordenSacerdotal.count({
    where: {
      id_parroquia: parish.id_parroquia,
      numero_identidad: { in: PERSONAS_QA.map(([dni]) => dni) },
    },
  });
  if (clericalRows !== 0) throw new Error('QA Personas must not have clerical records.');

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
