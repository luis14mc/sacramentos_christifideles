import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const { mockGetServerSession } = vi.hoisted(() => ({ mockGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockGetServerSession }));
vi.mock('@/lib/auth', () => ({ default: {}, authOptions: {} }));

import { prisma } from '@/lib/prisma';
import { GET as getExpediente } from '@/app/api/personas/[id]/expediente/route';
import { cargarExpedientePersona } from '@/lib/expediente';

let parishA: number;
let parishB: number;
let sectorA: bigint;
let sectorB: bigint;
let ordenId: number;
let rangoId: number;

const DEP = '08';
const MUN = '0801';
const SUJETO = 'EXP-SUJ';
const SAC = 'EXP-SAC';
const MADRE = 'EXP-MD';
const PADRE = 'EXP-PD';
const MADRINA = 'EXP-MN';
const PADRINO = 'EXP-PN';
const CATE = 'EXP-CT';

function setSession(parishId: number | null, rol = 'administrador') {
  if (parishId === null) mockGetServerSession.mockResolvedValue(null);
  else mockGetServerSession.mockResolvedValue({ user: { id: '1', parishId: String(parishId), rol } });
}

function getReq(): NextRequest {
  return new Request(`http://test.local/api/personas/${SUJETO}/expediente`) as unknown as NextRequest;
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function seedPersona(parishId: number, dni: string, sectorId: bigint) {
  await prisma.persona.create({
    data: {
      numero_identidad: dni,
      id_parroquia: parishId,
      id_sector_parroquial: sectorId,
      id_orden_religiosa: ordenId,
      nombres: 'N',
      apellidos: dni,
      fecha_nacimiento: new Date('1990-01-01'),
      lugar_nacimiento: MUN,
      sexo: 'M',
      telefono: '55555555',
      estado_vital: 1,
      estado_activo_parroquia: 1,
    },
  });
}

beforeAll(async () => {
  await prisma.departamento.upsert({
    where: { codigo_departamento: DEP },
    update: {},
    create: { codigo_departamento: DEP, nombre_departamento: 'FM' },
  });
  await prisma.municipio.upsert({
    where: { codigo_municipio: MUN },
    update: {},
    create: { codigo_municipio: MUN, codigo_departamento: DEP, nombre_municipio: 'DC' },
  });
  const tipo = await prisma.tipoSectorParroquial.create({ data: { nombre: 'Zona' } });
  const orden = await prisma.ordenReligiosa.create({ data: { nombre: 'Clero', rama: 'N' } });
  ordenId = orden.id_orden_religiosa;
  const rango = await prisma.rangoOrdenSacerdotal.create({ data: { nombre: 'Presbítero' } });
  rangoId = rango.id_rango_sacerdotal;

  const pA = await prisma.parroquia.create({
    data: { nombre: 'Parroquia A', ubicacion: MUN, direccion: 'x', telefono: '1' },
  });
  const pB = await prisma.parroquia.create({
    data: { nombre: 'Parroquia B', ubicacion: MUN, direccion: 'y', telefono: '2' },
  });
  parishA = pA.id_parroquia;
  parishB = pB.id_parroquia;

  sectorA = (
    await prisma.sectorParroquial.create({
      data: {
        id_parroquia: parishA,
        id_tipo_sector_parroquial: tipo.id_tipo_sector_parroquial,
        nombre: 'SA',
        direccion: 'x',
      },
    })
  ).id_sector_parroquial;
  sectorB = (
    await prisma.sectorParroquial.create({
      data: {
        id_parroquia: parishB,
        id_tipo_sector_parroquial: tipo.id_tipo_sector_parroquial,
        nombre: 'SB',
        direccion: 'y',
      },
    })
  ).id_sector_parroquial;

  for (const dni of [SUJETO, MADRE, PADRE, MADRINA, PADRINO, CATE, SAC]) {
    await seedPersona(parishA, dni, sectorA);
  }
  await seedPersona(parishB, SUJETO, sectorB);

  await prisma.ordenSacerdotal.create({
    data: {
      numero_identidad: SAC,
      id_rango_sacerdotal: rangoId,
      id_parroquia: parishA,
      id_orden_religiosa: ordenId,
    },
  });
});

afterEach(async () => {
  await prisma.bautismo.deleteMany({});
  vi.clearAllMocks();
});

afterAll(async () => {
  await prisma.bautismo.deleteMany({});
  await prisma.ordenSacerdotal.deleteMany({});
  await prisma.persona.deleteMany({});
  await prisma.sectorParroquial.deleteMany({});
  await prisma.parroquia.deleteMany({});
  await prisma.rangoOrdenSacerdotal.deleteMany({});
  await prisma.ordenReligiosa.deleteMany({});
  await prisma.tipoSectorParroquial.deleteMany({});
  await prisma.municipio.deleteMany({});
  await prisma.departamento.deleteMany({});
  await prisma.$disconnect();
});

describe('cargarExpedientePersona', () => {
  it('incluye bautismo del sujeto en su parroquia', async () => {
    const b = await prisma.bautismo.create({
      data: {
        id_parroquia: parishA,
        numero_identidad_bautizado: SUJETO,
        numero_identidad_madre: MADRE,
        numero_identidad_padre: PADRE,
        numero_identidad_madrina: MADRINA,
        numero_identidad_padrino: PADRINO,
        numero_identidad_catequista: CATE,
        numero_identidad_sacerdote: SAC,
        fecha_bautismo: new Date('2024-06-01'),
        numero_folio: '10',
        numero_libro: '3',
        numero_pagina: '2',
        numero_registro: '100',
      },
    });

    const exp = await cargarExpedientePersona(parishA, SUJETO);
    expect(exp).not.toBeNull();
    expect(exp!.entradas).toHaveLength(1);
    expect(exp!.entradas[0].id).toBe(b.id_bautismo.toString());
    expect(exp!.entradas[0].tipo).toBe('bautismo');
  });

  it('no incluye bautismos de otra parroquia (aislamiento por id_parroquia)', async () => {
    const dniB = 'EXP-B-SAC';
    await seedPersona(parishB, dniB, sectorB);
    await prisma.ordenSacerdotal.create({
      data: {
        numero_identidad: dniB,
        id_rango_sacerdotal: rangoId,
        id_parroquia: parishB,
        id_orden_religiosa: ordenId,
      },
    });
    for (const dni of [MADRE, PADRE, MADRINA, PADRINO, CATE].map((d) => `${d}-B`)) {
      await seedPersona(parishB, dni, sectorB);
    }
    await prisma.bautismo.create({
      data: {
        id_parroquia: parishB,
        numero_identidad_bautizado: SUJETO,
        numero_identidad_madre: `${MADRE}-B`,
        numero_identidad_padre: `${PADRE}-B`,
        numero_identidad_madrina: `${MADRINA}-B`,
        numero_identidad_padrino: `${PADRINO}-B`,
        numero_identidad_catequista: `${CATE}-B`,
        numero_identidad_sacerdote: dniB,
        fecha_bautismo: new Date('2024-06-01'),
        numero_folio: '1',
        numero_libro: '9',
        numero_pagina: '9',
        numero_registro: '999',
      },
    });

    const exp = await cargarExpedientePersona(parishA, SUJETO);
    expect(exp!.entradas).toHaveLength(0);
  });
});

describe('GET /api/personas/[id]/expediente', () => {
  it('sin sesión -> 401', async () => {
    setSession(null);
    expect((await getExpediente(getReq(), ctx(SUJETO))).status).toBe(401);
  });

  it('sin permiso canViewExpediente -> 403', async () => {
    setSession(parishA, 'guest');
    expect((await getExpediente(getReq(), ctx(SUJETO))).status).toBe(403);
  });

  it('persona inexistente en parroquia -> 404', async () => {
    setSession(parishA);
    expect((await getExpediente(getReq(), ctx('NO-EXISTE'))).status).toBe(404);
  });

  it('expediente vacío -> 200', async () => {
    setSession(parishA, 'secretaria');
    const res = await getExpediente(getReq(), ctx(SUJETO));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.numero_identidad).toBe(SUJETO);
    expect(body.entradas).toEqual([]);
  });
});
