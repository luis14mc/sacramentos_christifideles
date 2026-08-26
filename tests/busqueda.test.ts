import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const { mockGetServerSession } = vi.hoisted(() => ({ mockGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockGetServerSession }));
vi.mock('@/lib/auth', () => ({ default: {}, authOptions: {} }));

import { prisma } from '@/lib/prisma';
import { GET as getBusqueda } from '@/app/api/busqueda/route';
import { setupCatalogo, seedPersona, seedSacerdote, limpiarCatalogo, type Catalogo } from './helpers/sacramentos-fixtures';

let cat: Catalogo;
const P = { b: 'BZ1', m: 'MD1', p: 'PD1', mn: 'MN1', pn: 'PN1', c: 'CT1' };
const SAC = 'SAC-A';

function setSession(parishId: number | null, rol = 'administrador') {
  if (parishId === null) mockGetServerSession.mockResolvedValue(null);
  else mockGetServerSession.mockResolvedValue({ user: { id: '1', parishId: String(parishId), rol } });
}
function req(q: string): NextRequest {
  return new Request(`http://t/api/busqueda?q=${encodeURIComponent(q)}`) as unknown as NextRequest;
}

beforeAll(async () => {
  cat = await setupCatalogo();
  for (const dni of Object.values(P)) await seedPersona(cat.parishA, dni, cat.sectorA, cat.ordenId);
  await seedSacerdote(cat.parishA, SAC, cat.rangoId, cat.ordenId, cat.sectorA);
  await prisma.bautismo.create({
    data: {
      id_parroquia: cat.parishA,
      numero_identidad_bautizado: P.b, numero_identidad_madre: P.m, numero_identidad_padre: P.p,
      numero_identidad_madrina: P.mn, numero_identidad_padrino: P.pn, numero_identidad_catequista: P.c,
      numero_identidad_sacerdote: SAC, fecha_bautismo: new Date('2026-06-01T12:00:00.000Z'),
      numero_folio: '1', numero_libro: '70', numero_pagina: '1', numero_registro: '77',
    },
  });
});
afterAll(async () => {
  await prisma.bautismo.deleteMany({});
  await limpiarCatalogo();
  await prisma.$disconnect();
});

describe('GET /api/busqueda', () => {
  it('sin sesión -> 401', async () => {
    setSession(null);
    expect((await getBusqueda(req('BZ1'))).status).toBe(401);
  });
  it('sin permiso -> 403', async () => {
    setSession(cat.parishA, 'guest');
    expect((await getBusqueda(req('BZ1'))).status).toBe(403);
  });
  it('DNI exacto encuentra Persona y su bautismo', async () => {
    setSession(cat.parishA);
    const res = await getBusqueda(req('BZ1'));
    expect(res.headers.get('cache-control')).toBe('no-store');
    const json = await res.json();
    expect(json.personas.length).toBe(1);
    expect(json.bautismos.length).toBe(1);
  });
  it('busca por nombre', async () => {
    setSession(cat.parishA);
    expect((await (await getBusqueda(req('NBZ1'))).json()).personas.length).toBe(1);
  });
  it('busca por apellido', async () => {
    setSession(cat.parishA);
    expect((await (await getBusqueda(req('ABZ1'))).json()).personas.length).toBe(1);
  });
  it('busca por libro', async () => {
    setSession(cat.parishA);
    expect((await (await getBusqueda(req('70'))).json()).bautismos.length).toBe(1);
  });
  it('busca por registro', async () => {
    setSession(cat.parishA);
    expect((await (await getBusqueda(req('77'))).json()).bautismos.length).toBe(1);
  });
  it('busca por fecha exacta YYYY-MM-DD', async () => {
    setSession(cat.parishA);
    const json = await (await getBusqueda(req('2026-06-01'))).json();
    expect(json.bautismos.length).toBe(1);
  });
  it('tenant B no ve resultados de A', async () => {
    setSession(cat.parishB);
    expect((await (await getBusqueda(req('BZ1'))).json()).total).toBe(0);
  });
  it('q demasiado corta devuelve vacío', async () => {
    setSession(cat.parishA);
    expect((await (await getBusqueda(req('a'))).json()).total).toBe(0);
  });
});

describe('límite de resultados', () => {
  beforeAll(async () => {
    for (let i = 0; i < 16; i++) {
      await seedPersona(cat.parishA, `LIM${i}`, cat.sectorA, cat.ordenId);
      await prisma.persona.update({ where: { id_parroquia_numero_identidad: { id_parroquia: cat.parishA, numero_identidad: `LIM${i}` } }, data: { apellidos: 'ZZZCOMUN' } });
    }
  });
  it('no excede el límite por categoría', async () => {
    setSession(cat.parishA);
    const json = await (await getBusqueda(req('ZZZCOMUN'))).json();
    expect(json.personas.length).toBeLessThanOrEqual(15);
    expect(json.personas.length).toBe(15);
  });
});
