import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const { mockGetServerSession } = vi.hoisted(() => ({ mockGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockGetServerSession }));
vi.mock('@/lib/auth', () => ({ default: {}, authOptions: {} }));

import { prisma } from '@/lib/prisma';
import { GET as listBautismos, POST as createBautismo } from '@/app/api/bautismos/route';
import { GET as getBautismo, PUT as updateBautismo } from '@/app/api/bautismos/[id]/route';

let parishA: number;
let parishB: number;
let sectorA: bigint;
let sectorB: bigint;
let ordenId: number;
let rangoId: number;

const DEP = '08';
const MUN = '0801';
const SAC_A = 'SAC-A';
const SAC_B = 'SAC-B';
// Participantes en parroquia A
const P = { bautizado: 'BZ1', madre: 'MD1', padre: 'PD1', madrina: 'MN1', padrino: 'PN1', catequista: 'CT1' };
const PERSONA_B = 'BZB';

let registroSeq = 0;

function setSession(parishId: number | null, rol = 'administrador') {
  if (parishId === null) mockGetServerSession.mockResolvedValue(null);
  else mockGetServerSession.mockResolvedValue({ user: { id: '1', parishId: String(parishId), rol } });
}

function makeReq(body: unknown, url = 'http://test.local/api/bautismos'): NextRequest {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function getReq(url: string): NextRequest {
  return new Request(url) as unknown as NextRequest;
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function validBody(overrides: Record<string, unknown> = {}) {
  registroSeq += 1;
  return {
    numero_identidad_bautizado: P.bautizado,
    numero_identidad_madre: P.madre,
    numero_identidad_padre: P.padre,
    numero_identidad_madrina: P.madrina,
    numero_identidad_padrino: P.padrino,
    numero_identidad_catequista: P.catequista,
    numero_identidad_sacerdote: SAC_A,
    fecha_bautismo: '2026-01-15',
    numero_folio: '1',
    numero_libro: '1',
    numero_pagina: '1',
    numero_registro: String(registroSeq),
    ...overrides,
  };
}

async function seedPersona(parishId: number, dni: string, sectorId: bigint) {
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

async function crearBautismoDirecto(numeroRegistro: string) {
  return prisma.bautismo.create({
    data: {
      id_parroquia: parishA,
      numero_identidad_bautizado: P.bautizado,
      numero_identidad_madre: P.madre,
      numero_identidad_padre: P.padre,
      numero_identidad_madrina: P.madrina,
      numero_identidad_padrino: P.padrino,
      numero_identidad_catequista: P.catequista,
      numero_identidad_sacerdote: SAC_A,
      fecha_bautismo: new Date('2026-01-10'),
      numero_folio: '9',
      numero_libro: '9',
      numero_pagina: '9',
      numero_registro: numeroRegistro,
    },
  });
}

beforeAll(async () => {
  await prisma.departamento.upsert({ where: { codigo_departamento: DEP }, update: {}, create: { codigo_departamento: DEP, nombre_departamento: 'FM' } });
  await prisma.municipio.upsert({ where: { codigo_municipio: MUN }, update: {}, create: { codigo_municipio: MUN, codigo_departamento: DEP, nombre_municipio: 'DC' } });
  const tipo = await prisma.tipoSectorParroquial.create({ data: { nombre: 'Zona' } });
  const orden = await prisma.ordenReligiosa.create({ data: { nombre: 'Clero', rama: 'N' } });
  ordenId = orden.id_orden_religiosa;
  const rango = await prisma.rangoOrdenSacerdotal.create({ data: { nombre: 'Presbítero' } });
  rangoId = rango.id_rango_sacerdotal;

  const pA = await prisma.parroquia.create({ data: { nombre: 'A', ubicacion: MUN, direccion: 'x', telefono: '1' } });
  const pB = await prisma.parroquia.create({ data: { nombre: 'B', ubicacion: MUN, direccion: 'y', telefono: '2' } });
  parishA = pA.id_parroquia;
  parishB = pB.id_parroquia;

  sectorA = (await prisma.sectorParroquial.create({ data: { id_parroquia: parishA, id_tipo_sector_parroquial: tipo.id_tipo_sector_parroquial, nombre: 'SA', direccion: 'x' } })).id_sector_parroquial;
  sectorB = (await prisma.sectorParroquial.create({ data: { id_parroquia: parishB, id_tipo_sector_parroquial: tipo.id_tipo_sector_parroquial, nombre: 'SB', direccion: 'y' } })).id_sector_parroquial;

  // Participantes en A
  for (const dni of Object.values(P)) await seedPersona(parishA, dni, sectorA);
  // Persona en B (para probar participante de otra parroquia)
  await seedPersona(parishB, PERSONA_B, sectorB);

  // Sacerdotes
  await prisma.ordenSacerdotal.create({ data: { numero_identidad: SAC_A, id_rango_sacerdotal: rangoId, id_parroquia: parishA, id_orden_religiosa: ordenId, nombres: 'Padre', apellidos: 'A' } });
  await prisma.ordenSacerdotal.create({ data: { numero_identidad: SAC_B, id_rango_sacerdotal: rangoId, id_parroquia: parishB, id_orden_religiosa: ordenId, nombres: 'Padre', apellidos: 'B' } });
});

afterEach(async () => {
  await prisma.bitacoraCrud.deleteMany({});
  await prisma.bautismo.deleteMany({});
  vi.clearAllMocks();
});

afterAll(async () => {
  await prisma.bitacoraCrud.deleteMany({});
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

describe('CREATE /api/bautismos', () => {
  it('bautismo válido -> 201', async () => {
    setSession(parishA);
    const res = await createBautismo(makeReq(validBody()));
    expect(res.status).toBe(201);
  });

  it('sin sesión -> 401', async () => {
    setSession(null);
    expect((await createBautismo(makeReq(validBody()))).status).toBe(401);
  });

  it('sin permiso (solo lectura) -> 403', async () => {
    setSession(parishA, 'solo lectura');
    expect((await createBautismo(makeReq(validBody()))).status).toBe(403);
  });

  it.each(Object.entries(P))('%s inexistente -> 400', async (_role, _dni) => {
    setSession(parishA);
    const field = `numero_identidad_${_role}`;
    const res = await createBautismo(makeReq(validBody({ [field]: 'NOEXISTE' })));
    expect(res.status).toBe(400);
  });

  it('participante de otra parroquia -> 400', async () => {
    setSession(parishA);
    const res = await createBautismo(makeReq(validBody({ numero_identidad_bautizado: PERSONA_B })));
    expect(res.status).toBe(400);
  });

  it('sacerdote inexistente -> 400', async () => {
    setSession(parishA);
    expect((await createBautismo(makeReq(validBody({ numero_identidad_sacerdote: 'NOEXISTE' })))).status).toBe(400);
  });

  it('sacerdote de otra parroquia -> 400', async () => {
    setSession(parishA);
    expect((await createBautismo(makeReq(validBody({ numero_identidad_sacerdote: SAC_B })))).status).toBe(400);
  });

  it('fecha inválida -> 400', async () => {
    setSession(parishA);
    expect((await createBautismo(makeReq(validBody({ fecha_bautismo: 'no-fecha' })))).status).toBe(400);
  });

  it('registro duplicado -> 409', async () => {
    setSession(parishA);
    const body = validBody();
    expect((await createBautismo(makeReq(body))).status).toBe(201);
    expect((await createBautismo(makeReq(body))).status).toBe(409);
  });
});

describe('GET /api/bautismos', () => {
  it('listado solo del tenant actual', async () => {
    await crearBautismoDirecto('100');
    setSession(parishB);
    const resB = await listBautismos(getReq('http://test.local/api/bautismos'));
    expect((await resB.json()).total).toBe(0);
    setSession(parishA);
    const resA = await listBautismos(getReq('http://test.local/api/bautismos'));
    expect((await resA.json()).total).toBe(1);
  });

  it('detalle propio -> 200; cross-tenant -> 404', async () => {
    const b = await crearBautismoDirecto('101');
    setSession(parishA);
    expect((await getBautismo(getReq('http://x'), ctx(b.id_bautismo.toString()))).status).toBe(200);
    setSession(parishB);
    expect((await getBautismo(getReq('http://x'), ctx(b.id_bautismo.toString()))).status).toBe(404);
  });
});

describe('UPDATE /api/bautismos/[id]', () => {
  it('propio -> 200', async () => {
    const b = await crearBautismoDirecto('200');
    setSession(parishA);
    const body = validBody({ numero_libro: '9', numero_pagina: '9', numero_registro: '200', nota_marginal: 'ok' });
    const res = await updateBautismo(makeReq(body), ctx(b.id_bautismo.toString()));
    expect(res.status).toBe(200);
  });

  it('cross-tenant -> 404', async () => {
    const b = await crearBautismoDirecto('201');
    setSession(parishB);
    expect((await updateBautismo(makeReq(validBody()), ctx(b.id_bautismo.toString()))).status).toBe(404);
  });

  it('cambio a Persona inexistente -> 400', async () => {
    const b = await crearBautismoDirecto('202');
    setSession(parishA);
    const body = validBody({ numero_libro: '9', numero_pagina: '9', numero_registro: '202', numero_identidad_madre: 'NOEXISTE' });
    expect((await updateBautismo(makeReq(body), ctx(b.id_bautismo.toString()))).status).toBe(400);
  });

  it('cambio a Persona de otra parroquia -> 400', async () => {
    const b = await crearBautismoDirecto('203');
    setSession(parishA);
    const body = validBody({ numero_libro: '9', numero_pagina: '9', numero_registro: '203', numero_identidad_padre: PERSONA_B });
    expect((await updateBautismo(makeReq(body), ctx(b.id_bautismo.toString()))).status).toBe(400);
  });

  it('sacerdote de otra parroquia -> 400', async () => {
    const b = await crearBautismoDirecto('204');
    setSession(parishA);
    const body = validBody({ numero_libro: '9', numero_pagina: '9', numero_registro: '204', numero_identidad_sacerdote: SAC_B });
    expect((await updateBautismo(makeReq(body), ctx(b.id_bautismo.toString()))).status).toBe(400);
  });

  it('colisión registral -> 409', async () => {
    const b1 = await crearBautismoDirecto('205');
    const b2 = await prisma.bautismo.create({
      data: {
        id_parroquia: parishA,
        numero_identidad_bautizado: P.bautizado, numero_identidad_madre: P.madre, numero_identidad_padre: P.padre,
        numero_identidad_madrina: P.madrina, numero_identidad_padrino: P.padrino, numero_identidad_catequista: P.catequista,
        numero_identidad_sacerdote: SAC_A, fecha_bautismo: new Date('2026-01-11'),
        numero_folio: '9', numero_libro: '9', numero_pagina: '9', numero_registro: '206',
      },
    });
    setSession(parishA);
    // b2 intenta tomar el registro de b1 -> 409
    const body = validBody({ numero_libro: '9', numero_pagina: '9', numero_registro: '205' });
    expect((await updateBautismo(makeReq(body), ctx(b2.id_bautismo.toString()))).status).toBe(409);
  });
});

describe('RBAC', () => {
  it('solo lectura puede consultar listado -> 200', async () => {
    setSession(parishA, 'solo lectura');
    expect((await listBautismos(getReq('http://test.local/api/bautismos'))).status).toBe(200);
  });
  it('solo lectura no puede crear -> 403', async () => {
    setSession(parishA, 'solo lectura');
    expect((await createBautismo(makeReq(validBody()))).status).toBe(403);
  });
  it('solo lectura no puede editar -> 403', async () => {
    const b = await crearBautismoDirecto('300');
    setSession(parishA, 'solo lectura');
    expect((await updateBautismo(makeReq(validBody()), ctx(b.id_bautismo.toString()))).status).toBe(403);
  });
  it('administrador puede crear -> 201', async () => {
    setSession(parishA, 'administrador');
    expect((await createBautismo(makeReq(validBody()))).status).toBe(201);
  });
});

describe('AUDITORÍA', () => {
  it('create genera bitácora (accion C)', async () => {
    setSession(parishA);
    await createBautismo(makeReq(validBody()));
    const n = await prisma.bitacoraCrud.count({ where: { nombre_tabla: 'bautismo', accion: 'C', id_parroquia: parishA } });
    expect(n).toBe(1);
  });
  it('update genera bitácora (accion U)', async () => {
    const b = await crearBautismoDirecto('400');
    setSession(parishA);
    const body = validBody({ numero_libro: '9', numero_pagina: '9', numero_registro: '400' });
    await updateBautismo(makeReq(body), ctx(b.id_bautismo.toString()));
    const n = await prisma.bitacoraCrud.count({ where: { nombre_tabla: 'bautismo', accion: 'U', id_parroquia: parishA } });
    expect(n).toBe(1);
  });
});
