import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const { mockGetServerSession } = vi.hoisted(() => ({ mockGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockGetServerSession }));
vi.mock('@/lib/auth', () => ({ default: {}, authOptions: {} }));

import { prisma } from '@/lib/prisma';
import { GET as list, POST as create } from '@/app/api/matrimonios/route';
import { GET as getOne, PUT as update } from '@/app/api/matrimonios/[id]/route';
import { setupCatalogo, seedPersona, seedSacerdote, limpiarCatalogo, type Catalogo } from './helpers/sacramentos-fixtures';

let cat: Catalogo;
const SAC_A = 'SAC-A';
const SAC_B = 'SAC-B';
const ESPOSA = 'ES1', ESPOSO = 'EO1', MADRINA = 'MN1', PADRINO = 'PN1', MADRE_ESPOSA = 'MEA';
const PERSONA_B = 'PBm';
let seq = 0;

function setSession(parishId: number | null, rol = 'administrador') {
  if (parishId === null) mockGetServerSession.mockResolvedValue(null);
  else mockGetServerSession.mockResolvedValue({ user: { id: '1', parishId: String(parishId), rol } });
}
function makeReq(body: unknown): NextRequest {
  return new Request('http://t/api', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }) as unknown as NextRequest;
}
function getReq(url = 'http://t/api'): NextRequest {
  return new Request(url) as unknown as NextRequest;
}
function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}
function validBody(overrides: Record<string, unknown> = {}) {
  seq += 1;
  return {
    numero_identidad_esposa: ESPOSA,
    numero_identidad_esposo: ESPOSO,
    numero_identidad_madrina: MADRINA,
    numero_identidad_padrino: PADRINO,
    numero_identidad_sacerdote: SAC_A,
    fecha_matrimonio: '2026-04-10',
    numero_acta: '1',
    numero_libro: '1',
    numero_pagina: '1',
    numero_registro: String(seq),
    ...overrides,
  };
}
async function crearDirecto(numeroRegistro: string) {
  return prisma.matrimonio.create({
    data: {
      id_parroquia: cat.parishA,
      numero_identidad_esposa: ESPOSA, numero_identidad_esposo: ESPOSO,
      numero_identidad_madrina: MADRINA, numero_identidad_padrino: PADRINO,
      numero_identidad_sacerdote: SAC_A, fecha_matrimonio: new Date('2026-04-01'),
      numero_acta: '9', numero_libro: '9', numero_pagina: '9', numero_registro: numeroRegistro,
    },
  });
}

beforeAll(async () => {
  cat = await setupCatalogo();
  for (const dni of [ESPOSA, ESPOSO, MADRINA, PADRINO, MADRE_ESPOSA]) await seedPersona(cat.parishA, dni, cat.sectorA, cat.ordenId);
  await seedPersona(cat.parishB, PERSONA_B, cat.sectorB, cat.ordenId);
  await seedSacerdote(cat.parishA, SAC_A, cat.rangoId, cat.ordenId, cat.sectorA);
  await seedSacerdote(cat.parishB, SAC_B, cat.rangoId, cat.ordenId, cat.sectorB);
});
afterEach(async () => {
  await prisma.bitacoraCrud.deleteMany({});
  await prisma.matrimonio.deleteMany({});
  vi.clearAllMocks();
});
afterAll(async () => {
  await prisma.matrimonio.deleteMany({});
  await limpiarCatalogo();
  await prisma.$disconnect();
});

describe('CREATE /api/matrimonios', () => {
  it('válido -> 201', async () => { setSession(cat.parishA); expect((await create(makeReq(validBody()))).status).toBe(201); });
  it('sin sesión -> 401', async () => { setSession(null); expect((await create(makeReq(validBody()))).status).toBe(401); });
  it('sin permiso -> 403', async () => { setSession(cat.parishA, 'solo lectura'); expect((await create(makeReq(validBody()))).status).toBe(403); });
  it('esposa inexistente -> 400', async () => { setSession(cat.parishA); expect((await create(makeReq(validBody({ numero_identidad_esposa: 'NOEXISTE' })))).status).toBe(400); });
  it('esposo inexistente -> 400', async () => { setSession(cat.parishA); expect((await create(makeReq(validBody({ numero_identidad_esposo: 'NOEXISTE' })))).status).toBe(400); });
  it('esposa de otra parroquia -> 400', async () => { setSession(cat.parishA); expect((await create(makeReq(validBody({ numero_identidad_esposa: PERSONA_B })))).status).toBe(400); });
  it('esposo de otra parroquia -> 400', async () => { setSession(cat.parishA); expect((await create(makeReq(validBody({ numero_identidad_esposo: PERSONA_B })))).status).toBe(400); });
  it('madrina inexistente -> 400', async () => { setSession(cat.parishA); expect((await create(makeReq(validBody({ numero_identidad_madrina: 'NOEXISTE' })))).status).toBe(400); });
  it('padrino inexistente -> 400', async () => { setSession(cat.parishA); expect((await create(makeReq(validBody({ numero_identidad_padrino: 'NOEXISTE' })))).status).toBe(400); });
  it('padre/madre opcional válido -> 201', async () => { setSession(cat.parishA); expect((await create(makeReq(validBody({ numero_identidad_madre_esposa: MADRE_ESPOSA })))).status).toBe(201); });
  it('padre/madre opcional inexistente -> 400', async () => { setSession(cat.parishA); expect((await create(makeReq(validBody({ numero_identidad_madre_esposa: 'NOEXISTE' })))).status).toBe(400); });
  it('padre/madre opcional de otra parroquia -> 400', async () => { setSession(cat.parishA); expect((await create(makeReq(validBody({ numero_identidad_padre_esposo: PERSONA_B })))).status).toBe(400); });
  it('sacerdote inexistente -> 400', async () => { setSession(cat.parishA); expect((await create(makeReq(validBody({ numero_identidad_sacerdote: 'NOEXISTE' })))).status).toBe(400); });
  it('sacerdote de otra parroquia -> 400', async () => { setSession(cat.parishA); expect((await create(makeReq(validBody({ numero_identidad_sacerdote: SAC_B })))).status).toBe(400); });
  it('esposa == esposo -> 400', async () => { setSession(cat.parishA); expect((await create(makeReq(validBody({ numero_identidad_esposo: ESPOSA })))).status).toBe(400); });
  it('fecha inválida -> 400', async () => { setSession(cat.parishA); expect((await create(makeReq(validBody({ fecha_matrimonio: 'x' })))).status).toBe(400); });
  it('registrales faltantes -> 400', async () => { setSession(cat.parishA); expect((await create(makeReq(validBody({ numero_acta: '' })))).status).toBe(400); });
  it('duplicado -> 409', async () => {
    setSession(cat.parishA);
    const body = validBody();
    expect((await create(makeReq(body))).status).toBe(201);
    expect((await create(makeReq(body))).status).toBe(409);
  });
});

describe('GET', () => {
  it('listado solo del tenant', async () => {
    await crearDirecto('100');
    setSession(cat.parishB); expect((await (await list(getReq())).json()).total).toBe(0);
    setSession(cat.parishA); expect((await (await list(getReq())).json()).total).toBe(1);
  });
  it('detalle propio 200 / cross-tenant 404', async () => {
    const r = await crearDirecto('101');
    setSession(cat.parishA); expect((await getOne(getReq(), ctx(r.id_matrimonio.toString()))).status).toBe(200);
    setSession(cat.parishB); expect((await getOne(getReq(), ctx(r.id_matrimonio.toString()))).status).toBe(404);
  });
});

describe('UPDATE', () => {
  it('propio -> 200', async () => {
    const r = await crearDirecto('200'); setSession(cat.parishA);
    expect((await update(makeReq(validBody({ numero_libro: '9', numero_pagina: '9', numero_registro: '200' })), ctx(r.id_matrimonio.toString()))).status).toBe(200);
  });
  it('cross-tenant -> 404', async () => {
    const r = await crearDirecto('201'); setSession(cat.parishB);
    expect((await update(makeReq(validBody()), ctx(r.id_matrimonio.toString()))).status).toBe(404);
  });
  it('participante inexistente -> 400', async () => {
    const r = await crearDirecto('202'); setSession(cat.parishA);
    expect((await update(makeReq(validBody({ numero_libro: '9', numero_pagina: '9', numero_registro: '202', numero_identidad_madrina: 'NOEXISTE' })), ctx(r.id_matrimonio.toString()))).status).toBe(400);
  });
  it('participante de otra parroquia -> 400', async () => {
    const r = await crearDirecto('203'); setSession(cat.parishA);
    expect((await update(makeReq(validBody({ numero_libro: '9', numero_pagina: '9', numero_registro: '203', numero_identidad_esposa: PERSONA_B })), ctx(r.id_matrimonio.toString()))).status).toBe(400);
  });
  it('padre opcional inválido -> 400', async () => {
    const r = await crearDirecto('204'); setSession(cat.parishA);
    expect((await update(makeReq(validBody({ numero_libro: '9', numero_pagina: '9', numero_registro: '204', numero_identidad_padre_esposa: 'NOEXISTE' })), ctx(r.id_matrimonio.toString()))).status).toBe(400);
  });
  it('sacerdote de otra parroquia -> 400', async () => {
    const r = await crearDirecto('205'); setSession(cat.parishA);
    expect((await update(makeReq(validBody({ numero_libro: '9', numero_pagina: '9', numero_registro: '205', numero_identidad_sacerdote: SAC_B })), ctx(r.id_matrimonio.toString()))).status).toBe(400);
  });
  it('misma Persona como ambos cónyuges -> 400', async () => {
    const r = await crearDirecto('206'); setSession(cat.parishA);
    expect((await update(makeReq(validBody({ numero_libro: '9', numero_pagina: '9', numero_registro: '206', numero_identidad_esposo: ESPOSA })), ctx(r.id_matrimonio.toString()))).status).toBe(400);
  });
  it('colisión registral -> 409', async () => {
    await crearDirecto('207');
    const r2 = await prisma.matrimonio.create({ data: { id_parroquia: cat.parishA, numero_identidad_esposa: ESPOSA, numero_identidad_esposo: ESPOSO, numero_identidad_madrina: MADRINA, numero_identidad_padrino: PADRINO, numero_identidad_sacerdote: SAC_A, fecha_matrimonio: new Date('2026-04-02'), numero_acta: '9', numero_libro: '9', numero_pagina: '9', numero_registro: '208' } });
    setSession(cat.parishA);
    expect((await update(makeReq(validBody({ numero_libro: '9', numero_pagina: '9', numero_registro: '207' })), ctx(r2.id_matrimonio.toString()))).status).toBe(409);
  });
});

describe('RBAC', () => {
  it('solo lectura GET 200', async () => { setSession(cat.parishA, 'solo lectura'); expect((await list(getReq())).status).toBe(200); });
  it('solo lectura POST 403', async () => { setSession(cat.parishA, 'solo lectura'); expect((await create(makeReq(validBody()))).status).toBe(403); });
  it('solo lectura PUT 403', async () => { const r = await crearDirecto('300'); setSession(cat.parishA, 'solo lectura'); expect((await update(makeReq(validBody()), ctx(r.id_matrimonio.toString()))).status).toBe(403); });
});

describe('AUDITORÍA', () => {
  it('create genera bitácora C', async () => {
    setSession(cat.parishA); await create(makeReq(validBody()));
    expect(await prisma.bitacoraCrud.count({ where: { nombre_tabla: 'matrimonio', accion: 'C' } })).toBe(1);
  });
  it('update genera bitácora U', async () => {
    const r = await crearDirecto('400'); setSession(cat.parishA);
    await update(makeReq(validBody({ numero_libro: '9', numero_pagina: '9', numero_registro: '400' })), ctx(r.id_matrimonio.toString()));
    expect(await prisma.bitacoraCrud.count({ where: { nombre_tabla: 'matrimonio', accion: 'U' } })).toBe(1);
  });
});
