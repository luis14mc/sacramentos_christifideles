import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const { mockGetServerSession } = vi.hoisted(() => ({ mockGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockGetServerSession }));
vi.mock('@/lib/auth', () => ({ default: {}, authOptions: {} }));

import { prisma } from '@/lib/prisma';
import { GET as getLibros } from '@/app/api/libros/route';
import { setupCatalogo, seedPersona, seedSacerdote, limpiarCatalogo, type Catalogo } from './helpers/sacramentos-fixtures';

let cat: Catalogo;
const P = { b: 'BZ1', m: 'MD1', p: 'PD1', mn: 'MN1', pn: 'PN1', c: 'CT1' };
const SAC = 'SAC-A';

function setSession(parishId: number | null, rol = 'administrador') {
  if (parishId === null) mockGetServerSession.mockResolvedValue(null);
  else mockGetServerSession.mockResolvedValue({ user: { id: '1', parishId: String(parishId), rol } });
}
function req(qs: string): NextRequest {
  return new Request(`http://t/api/libros?${qs}`) as unknown as NextRequest;
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
      numero_identidad_sacerdote: SAC, fecha_bautismo: new Date('2026-05-01'),
      numero_folio: '1', numero_libro: '1', numero_pagina: '1', numero_registro: '5',
    },
  });
});
afterAll(async () => {
  await prisma.bautismo.deleteMany({});
  await limpiarCatalogo();
  await prisma.$disconnect();
});

describe('GET /api/libros', () => {
  it('sin sesión -> 401', async () => {
    setSession(null);
    expect((await getLibros(req('sacramento=bautismo'))).status).toBe(401);
  });
  it('sacramento inválido -> 400', async () => {
    setSession(cat.parishA);
    expect((await getLibros(req('sacramento=defuncion'))).status).toBe(400);
  });
  it('listado tenant A muestra el registro', async () => {
    setSession(cat.parishA);
    const json = await (await getLibros(req('sacramento=bautismo'))).json();
    expect(json.total).toBe(1);
    expect(json.data[0].numero_registro).toBe('5');
    expect(json.data[0].personaPrincipal.numero_identidad).toBe(P.b);
  });
  it('tenant B no ve registros de A', async () => {
    setSession(cat.parishB);
    expect((await (await getLibros(req('sacramento=bautismo'))).json()).total).toBe(0);
  });
  it('filtro por libro', async () => {
    setSession(cat.parishA);
    expect((await (await getLibros(req('sacramento=bautismo&libro=1'))).json()).total).toBe(1);
    expect((await (await getLibros(req('sacramento=bautismo&libro=99'))).json()).total).toBe(0);
  });
  it('filtro por registro', async () => {
    setSession(cat.parishA);
    expect((await (await getLibros(req('sacramento=bautismo&registro=5'))).json()).total).toBe(1);
    expect((await (await getLibros(req('sacramento=bautismo&registro=999'))).json()).total).toBe(0);
  });
  it('filtro por nombre de persona', async () => {
    setSession(cat.parishA);
    expect((await (await getLibros(req(`sacramento=bautismo&q=${encodeURIComponent('N' + P.b)}`))).json()).total).toBe(1);
    expect((await (await getLibros(req('sacramento=bautismo&q=zzz'))).json()).total).toBe(0);
  });
  it('solo lectura puede consultar -> 200', async () => {
    setSession(cat.parishA, 'solo lectura');
    expect((await getLibros(req('sacramento=bautismo'))).status).toBe(200);
  });
});
