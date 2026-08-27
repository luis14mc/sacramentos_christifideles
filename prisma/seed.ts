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
  const sector = sectorExisting
    ? await prisma.sectorParroquial.update({
      where: { id_sector_parroquial: sectorExisting.id_sector_parroquial },
      data: sectorData,
    })
    : await prisma.sectorParroquial.create({ data: sectorData });
  console.log('✓ Configuración y sector asegurados');

  const ordenDiocesana = await prisma.ordenReligiosa.findFirstOrThrow({
    where: { nombre: 'Diocesano' },
    orderBy: { id_orden_religiosa: 'asc' },
  });
  const personas = [
    { numero_identidad: '0801-1990-00001', nombres: 'Juan Carlos', apellidos: 'Martínez', fecha_nacimiento: new Date('1990-05-18'), sexo: 'M', telefono: '+504 9981-2401', direccion: 'Colonia Loarque, bloque A, Distrito Central', estado_vital: 1 },
    { numero_identidad: '0801-1985-00002', nombres: 'José Antonio', apellidos: 'López', fecha_nacimiento: new Date('1985-09-12'), sexo: 'M', telefono: '+504 9874-3152', direccion: 'Residencial Loarque Sur, Distrito Central', estado_vital: 1 },
    { numero_identidad: '0801-1970-00003', nombres: 'Miguel Ángel', apellidos: 'Rodríguez', fecha_nacimiento: new Date('1970-03-24'), sexo: 'M', telefono: '+504 9762-4803', direccion: 'Colonia San José de Loarque, Distrito Central', estado_vital: 1 },
    { numero_identidad: '0801-1992-00004', nombres: 'María Fernanda', apellidos: 'García', fecha_nacimiento: new Date('1992-11-08'), sexo: 'F', telefono: '+504 9653-5724', direccion: 'Residencial Las Uvas, Distrito Central', estado_vital: 1 },
    { numero_identidad: '0801-1960-00005', nombres: 'Pedro', apellidos: 'Hernández', fecha_nacimiento: new Date('1960-07-16'), sexo: 'M', telefono: '+504 9541-6805', direccion: 'Aldea Loarque, Distrito Central', estado_vital: 0 },
    { numero_identidad: '0801-1995-00006', nombres: 'Carlos', apellidos: 'Mejía', fecha_nacimiento: new Date('1995-01-29'), sexo: 'M', telefono: '+504 9432-7956', direccion: 'Colonia Satélite, Distrito Central', estado_vital: 1 },
  ] as const;
  for (const persona of personas) {
    const data = {
      ...persona,
      id_sector_parroquial: sector.id_sector_parroquial,
      id_orden_religiosa: ordenDiocesana.id_orden_religiosa,
      lugar_nacimiento: '0801',
      estado_activo_parroquia: 1,
      email: null,
      otra_orden_religiosa: null,
      imagen: null,
    };
    await prisma.persona.upsert({
      where: {
        id_parroquia_numero_identidad: {
          id_parroquia: parish.id_parroquia,
          numero_identidad: persona.numero_identidad,
        },
      },
      update: data,
      create: { ...data, id_parroquia: parish.id_parroquia },
    });
  }
  console.log('✓ Personas de QA aseguradas');

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
