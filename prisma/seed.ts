import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

const prisma = new PrismaClient();

const DEFAULT_EMAIL = 'admin@cristoresucitado.org';
const DEFAULT_PASSWORD = 'Admin1234';

async function main() {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowsDevelopmentDefaults =
    process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  const email = process.env.SEED_SUPERADMIN_EMAIL?.trim();
  const password = process.env.SEED_SUPERADMIN_PASSWORD;

  if (isProduction) {
    throw new Error('Development/testing seed is blocked in production.');
  }

  if ((!email || !password) && !allowsDevelopmentDefaults) {
    throw new Error(
      'SEED_SUPERADMIN_EMAIL and SEED_SUPERADMIN_PASSWORD are required outside development/testing.',
    );
  }

  const adminEmail = email || DEFAULT_EMAIL;
  const adminPassword = password || DEFAULT_PASSWORD;

  console.log('Seeding required development/testing data...');

  await prisma.departamento.upsert({
    where: { codigo_departamento: '08' },
    update: { nombre_departamento: 'Francisco Morazán' },
    create: { codigo_departamento: '08', nombre_departamento: 'Francisco Morazán' },
  });
  await prisma.municipio.upsert({
    where: { codigo_municipio: '0801' },
    update: { codigo_departamento: '08', nombre_municipio: 'Distrito Central' },
    create: {
      codigo_municipio: '0801',
      codigo_departamento: '08',
      nombre_municipio: 'Distrito Central',
    },
  });
  console.log('✓ Ubicación base asegurada');

  for (const item of [
    { nombre: 'Diocesano', abreviatura: 'DIOC', rama: 'M' },
    { nombre: 'Salesiano', abreviatura: 'SDB', rama: 'M' },
  ]) {
    const existing = await prisma.ordenReligiosa.findFirst({
      where: { nombre: item.nombre },
      orderBy: { id_orden_religiosa: 'asc' },
    });
    const data = { ...item, descripcion: item.nombre };
    if (existing) {
      await prisma.ordenReligiosa.update({
        where: { id_orden_religiosa: existing.id_orden_religiosa },
        data,
      });
    } else {
      await prisma.ordenReligiosa.create({ data });
    }
  }
  console.log('✓ Órdenes religiosas aseguradas');

  for (const nombre of ['Diácono', 'Sacerdote', 'Obispo']) {
    const existing = await prisma.rangoOrdenSacerdotal.findFirst({
      where: { nombre },
      orderBy: { id_rango_sacerdotal: 'asc' },
    });
    const data = { nombre, descripcion: nombre };
    if (existing) {
      await prisma.rangoOrdenSacerdotal.update({
        where: { id_rango_sacerdotal: existing.id_rango_sacerdotal },
        data,
      });
    } else {
      await prisma.rangoOrdenSacerdotal.create({ data });
    }
  }
  console.log('✓ Rangos sacerdotales asegurados');

  const tipoSectorExisting = await prisma.tipoSectorParroquial.findFirst({
    where: { nombre: 'General' },
    orderBy: { id_tipo_sector_parroquial: 'asc' },
  });
  const tipoSector = tipoSectorExisting
    ? await prisma.tipoSectorParroquial.update({
        where: { id_tipo_sector_parroquial: tipoSectorExisting.id_tipo_sector_parroquial },
        data: { descripcion: 'Sector parroquial general' },
      })
    : await prisma.tipoSectorParroquial.create({
        data: { nombre: 'General', descripcion: 'Sector parroquial general' },
      });

  const parishData = {
    nombre: 'Cristo Resucitado de Loarque',
    ubicacion: '0801',
    direccion: 'Loarque, Distrito Central, Francisco Morazán',
    telefono: '+504 0000-0000',
    email: 'admin@cristoresucitado.org',
  };
  const parishExisting = await prisma.parroquia.findFirst({
    where: { nombre: parishData.nombre },
    orderBy: { id_parroquia: 'asc' },
  });
  const parish = parishExisting
    ? await prisma.parroquia.update({
        where: { id_parroquia: parishExisting.id_parroquia },
        data: parishData,
      })
    : await prisma.parroquia.create({ data: parishData });
  console.log('✓ Parroquia asegurada');

  await prisma.parroquiaConfig.upsert({
    where: { id_parroquia: parish.id_parroquia },
    update: {
      alias_liturgico: parishData.nombre,
      tz: 'America/Tegucigalpa',
      idioma: 'es',
    },
    create: {
      id_parroquia: parish.id_parroquia,
      alias_liturgico: parishData.nombre,
      tz: 'America/Tegucigalpa',
      idioma: 'es',
      opciones: {},
    },
  });

  const sectorExisting = await prisma.sectorParroquial.findFirst({
    where: { id_parroquia: parish.id_parroquia, nombre: 'General' },
    orderBy: { id_sector_parroquial: 'asc' },
  });
  const sectorData = {
    id_parroquia: parish.id_parroquia,
    id_tipo_sector_parroquial: tipoSector.id_tipo_sector_parroquial,
    nombre: 'General',
    nombre_capilla: null,
    direccion: parishData.direccion,
  };
  if (sectorExisting) {
    await prisma.sectorParroquial.update({
      where: { id_sector_parroquial: sectorExisting.id_sector_parroquial },
      data: sectorData,
    });
  } else {
    await prisma.sectorParroquial.create({ data: sectorData });
  }
  console.log('✓ Configuración y sector asegurados');

  const roleExisting = await prisma.rolUsuario.findFirst({
    where: { nombre: 'Super Admin' },
    orderBy: { id_rol: 'asc' },
  });
  const roleData = {
    nombre: 'Super Admin',
    descripcion: 'Administrador del sistema completo',
    estado: 1,
    id_usuario_creacion: BigInt(0),
  };
  const role = roleExisting
    ? await prisma.rolUsuario.update({ where: { id_rol: roleExisting.id_rol }, data: roleData })
    : await prisma.rolUsuario.create({ data: roleData });

  const passwordHash = Buffer.from(await hash(adminPassword, 12));
  const userData = {
    id_parroquia: parish.id_parroquia,
    id_rol: role.id_rol,
    nombre: 'Super Admin',
    contrasena: passwordHash,
    estado: 1,
    id_usuario_creacion: BigInt(0),
  };
  await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: userData,
    create: { ...userData, email: adminEmail },
  });

  console.log(`✓ Super Admin asegurado: ${adminEmail}`);
  console.log('✓ Seed completado');
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Seed failed.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
