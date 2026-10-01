import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const { mockGetServerSession } = vi.hoisted(() => ({ mockGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockGetServerSession }));
vi.mock('@/lib/auth', () => ({ default: {}, authOptions: {} }));

import { prisma } from '@/lib/prisma';
import { GET as getParroquia, PUT as putParroquia } from '@/app/api/configuracion/parroquia/route';
import { construirTokens, TOKENS_CONSTANCIA } from '@/lib/constancias';

let parishA: number;
let parishB: number;

const DEP = '08';
const MUN = '0801';

function setSession(parishId: number | null, rol = 'administrador') {
  if (parishId === null) {
    mockGetServerSession.mockResolvedValue(null);
  } else {
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', parishId: String(parishId), rol },
    });
  }
}

function getReq(): NextRequest {
  return new Request('http://test.local/api/configuracion/parroquia') as unknown as NextRequest;
}
void getReq;

function putReq(body: unknown): NextRequest {
  return new Request('http://test.local/api/configuracion/parroquia', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeAll(async () => {
  await prisma.departamento.upsert({
    where: { codigo_departamento: DEP }, update: {},
    create: { codigo_departamento: DEP, nombre_departamento: 'Francisco Morazán' },
  });
  await prisma.municipio.upsert({
    where: { codigo_municipio: MUN }, update: {},
    create: { codigo_municipio: MUN, codigo_departamento: DEP, nombre_municipio: 'Distrito Central' },
  });
  const pA = await prisma.parroquia.create({
    data: { nombre: 'San Pedro', ubicacion: MUN, direccion: 'Calle 1', telefono: '1111' },
  });
  const pB = await prisma.parroquia.create({
    data: { nombre: 'San Pablo', ubicacion: MUN, direccion: 'Calle 2', telefono: '2222' },
  });
  parishA = pA.id_parroquia;
  parishB = pB.id_parroquia;
});

afterEach(async () => {
  await prisma.bitacoraCrud.deleteMany({});
  vi.clearAllMocks();
});

afterAll(async () => {
  await prisma.bitacoraCrud.deleteMany({});
  await prisma.parroquiaConfig.deleteMany({});
  await prisma.parroquia.deleteMany({});
  await prisma.municipio.deleteMany({});
  await prisma.departamento.deleteMany({});
  await prisma.$disconnect();
});

describe('GET /api/configuracion/parroquia', () => {
  it('sin sesión -> 401', async () => {
    setSession(null);
    expect((await getParroquia()).status).toBe(401);
  });

  it('devuelve datos de la parroquia de la sesión -> 200', async () => {
    await prisma.parroquia.update({
      where: { id_parroquia: parishA },
      data: { email: 'san@pedro.org' },
    });
    await prisma.parroquiaConfig.upsert({
      where: { id_parroquia: parishA },
      update: { alias_liturgico: 'San Pedro Apóstol', parroco_nombre: 'Padre Juan' },
      create: {
        id_parroquia: parishA,
        alias_liturgico: 'San Pedro Apóstol',
        parroco_nombre: 'Padre Juan',
      },
    });
    setSession(parishA);
    const res = await getParroquia();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id_parroquia).toBe(parishA);
    expect(json.nombre).toBe('San Pedro');
    expect(json.alias_liturgico).toBe('San Pedro Apóstol');
    expect(json.parroco_nombre).toBe('Padre Juan');
  });

  it('sin permiso canViewConfiguracion -> 403', async () => {
    setSession(parishA, 'guest');
    expect((await getParroquia()).status).toBe(403);
  });
});

describe('PUT /api/configuracion/parroquia', () => {
  it('sin sesión -> 401', async () => {
    setSession(null);
    expect((await putParroquia(putReq({ nombre: 'X', direccion: 'Y', telefono: 'Z' }))).status).toBe(401);
  });

  it('rol secretaria -> 403 (no puede modificar)', async () => {
    setSession(parishA, 'secretario');
    const res = await putParroquia(putReq({ nombre: 'San Pedro', direccion: 'Calle 1', telefono: '1111' }));
    expect(res.status).toBe(403);
  });

  it('PUT OK actualiza parroquia + config y registra auditoría', async () => {
    setSession(parishA);
    const res = await putParroquia(putReq({
      nombre: 'San Pedro Apóstol',
      direccion: 'Calle 1 #100',
      telefono: '1111-1111',
      email: 'san@pedro.org',
      alias_liturgico: 'SPA',
      parroco_nombre: 'Padre Juan',
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.nombre).toBe('San Pedro Apóstol');
    expect(json.parroco_nombre).toBe('Padre Juan');
    expect(json.alias_liturgico).toBe('SPA');

    const parroquia = await prisma.parroquia.findUniqueOrThrow({ where: { id_parroquia: parishA } });
    expect(parroquia.direccion).toBe('Calle 1 #100');

    const bitacora = await prisma.bitacoraCrud.findMany({
      where: { nombre_tabla: 'parroquia', id_parroquia: parishA, accion: 'U' },
    });
    expect(bitacora.length).toBe(1);
    expect(bitacora[0].old_values).toBeTruthy();
    expect(bitacora[0].new_values).toBeTruthy();
  });

  it('ignora id_parroquia enviado por el cliente y opera sobre la parroquia de sesión', async () => {
    setSession(parishA);
    await putParroquia(putReq({
      nombre: 'San Pedro',
      direccion: 'Calle 1',
      telefono: '1111',
      id_parroquia: parishB,
    }));
    const parroquiaB = await prisma.parroquia.findUniqueOrThrow({ where: { id_parroquia: parishB } });
    expect(parroquiaB.nombre).toBe('San Pablo');
  });

  it('nombre obligatorio -> 400', async () => {
    setSession(parishA);
    const res = await putParroquia(putReq({ nombre: '', direccion: 'x', telefono: '1' }));
    expect(res.status).toBe(400);
  });

  it('dirección obligatoria -> 400', async () => {
    setSession(parishA);
    const res = await putParroquia(putReq({ nombre: 'X', direccion: '', telefono: '1' }));
    expect(res.status).toBe(400);
  });

  it('teléfono obligatorio -> 400', async () => {
    setSession(parishA);
    const res = await putParroquia(putReq({ nombre: 'X', direccion: 'x', telefono: '' }));
    expect(res.status).toBe(400);
  });

  it('email inválido -> 400', async () => {
    setSession(parishA);
    const res = await putParroquia(putReq({
      nombre: 'X',
      direccion: 'x',
      telefono: '1',
      email: 'no-es-email',
    }));
    expect(res.status).toBe(400);
  });
});

describe('token parroco en construirTokens', () => {
  it('parroquia.parroco está en TOKENS_CONSTANCIA', () => {
    expect(TOKENS_CONSTANCIA).toContain('parroquia.parroco');
  });

  it('construirTokens devuelve parroco o "—" cuando no está definido', () => {
    const tokens = construirTokens({
      sacramento: 'bautismo',
      id: '1',
      parroquia: { nombre: 'P', direccion: 'D', telefono: 'T' },
      parroco: null,
      aliasLiturgico: null,
      tz: 'America/Tegucigalpa',
      personaPrincipal: null,
      conyuge: null,
      ministro: null,
      fecha: null,
      numero_acta: null,
      numero_libro: '1',
      numero_pagina: null,
      numero_registro: '1',
      nota_marginal: null,
    });
    expect(tokens['parroquia.parroco']).toBe('—');
  });

  it('construirTokens expone el parroco definido en parroquia_config', () => {
    const tokens = construirTokens({
      sacramento: 'bautismo',
      id: '1',
      parroquia: { nombre: 'P', direccion: 'D', telefono: 'T' },
      parroco: 'Padre Juan',
      aliasLiturgico: null,
      tz: 'America/Tegucigalpa',
      personaPrincipal: null,
      conyuge: null,
      ministro: null,
      fecha: null,
      numero_acta: null,
      numero_libro: '1',
      numero_pagina: null,
      numero_registro: '1',
      nota_marginal: null,
    });
    expect(tokens['parroquia.parroco']).toBe('Padre Juan');
  });
});