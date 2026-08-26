import { prisma } from '@/lib/prisma';

export const DEP = '08';
export const MUN = '0801';

export interface Catalogo {
  parishA: number;
  parishB: number;
  sectorA: bigint;
  sectorB: bigint;
  ordenId: number;
  rangoId: number;
}

export async function setupCatalogo(): Promise<Catalogo> {
  await prisma.departamento.upsert({ where: { codigo_departamento: DEP }, update: {}, create: { codigo_departamento: DEP, nombre_departamento: 'FM' } });
  await prisma.municipio.upsert({ where: { codigo_municipio: MUN }, update: {}, create: { codigo_municipio: MUN, codigo_departamento: DEP, nombre_municipio: 'DC' } });
  const tipo = await prisma.tipoSectorParroquial.create({ data: { nombre: 'Zona' } });
  const orden = await prisma.ordenReligiosa.create({ data: { nombre: 'Clero', rama: 'N' } });
  const rango = await prisma.rangoOrdenSacerdotal.create({ data: { nombre: 'Presbítero' } });
  const pA = await prisma.parroquia.create({ data: { nombre: 'A', ubicacion: MUN, direccion: 'x', telefono: '1' } });
  const pB = await prisma.parroquia.create({ data: { nombre: 'B', ubicacion: MUN, direccion: 'y', telefono: '2' } });
  const sA = await prisma.sectorParroquial.create({ data: { id_parroquia: pA.id_parroquia, id_tipo_sector_parroquial: tipo.id_tipo_sector_parroquial, nombre: 'SA', direccion: 'x' } });
  const sB = await prisma.sectorParroquial.create({ data: { id_parroquia: pB.id_parroquia, id_tipo_sector_parroquial: tipo.id_tipo_sector_parroquial, nombre: 'SB', direccion: 'y' } });
  return {
    parishA: pA.id_parroquia,
    parishB: pB.id_parroquia,
    sectorA: sA.id_sector_parroquial,
    sectorB: sB.id_sector_parroquial,
    ordenId: orden.id_orden_religiosa,
    rangoId: rango.id_rango_sacerdotal,
  };
}

export async function seedPersona(parishId: number, dni: string, sectorId: bigint, ordenId: number) {
  await prisma.persona.create({
    data: {
      numero_identidad: dni,
      id_parroquia: parishId,
      id_sector_parroquial: sectorId,
      id_orden_religiosa: ordenId,
      nombres: 'N' + dni,
      apellidos: 'A' + dni,
      fecha_nacimiento: new Date('1990-01-01'),
      lugar_nacimiento: MUN,
      sexo: 'M',
      telefono: '55555555',
      estado_vital: 1,
      estado_activo_parroquia: 1,
    },
  });
}

export async function seedSacerdote(
  parishId: number,
  dni: string,
  rangoId: number,
  ordenId: number,
  sectorId: bigint,
  extras?: { estado_ministerial?: number; estado_vital?: number }
) {
  await seedPersona(parishId, dni, sectorId, ordenId);
  if (extras?.estado_vital !== undefined && extras.estado_vital !== 1) {
    await prisma.persona.update({
      where: { id_parroquia_numero_identidad: { id_parroquia: parishId, numero_identidad: dni } },
      data: { estado_vital: extras.estado_vital },
    });
  }
  await prisma.ordenSacerdotal.create({
    data: {
      numero_identidad: dni,
      id_rango_sacerdotal: rangoId,
      id_parroquia: parishId,
      id_orden_religiosa: ordenId,
      estado_ministerial: extras?.estado_ministerial ?? 1,
    },
  });
}

export async function limpiarCatalogo() {
  await prisma.bitacoraCrud.deleteMany({});
  await prisma.bautismo.deleteMany({});
  await prisma.primeraComunion.deleteMany({});
  await prisma.confirmacion.deleteMany({});
  await prisma.matrimonio.deleteMany({});
  await prisma.numeradores.deleteMany({});
  await prisma.ordenSacerdotal.deleteMany({});
  await prisma.persona.deleteMany({});
  await prisma.sectorParroquial.deleteMany({});
  await prisma.parroquiaConfig.deleteMany({});
  await prisma.parroquia.deleteMany({});
  await prisma.rangoOrdenSacerdotal.deleteMany({});
  await prisma.ordenReligiosa.deleteMany({});
  await prisma.tipoSectorParroquial.deleteMany({});
  await prisma.municipio.deleteMany({});
  await prisma.departamento.deleteMany({});
}
