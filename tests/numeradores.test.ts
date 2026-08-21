import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const { mockGetServerSession } = vi.hoisted(() => ({ mockGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockGetServerSession }));
vi.mock('@/lib/auth', () => ({ default: {}, authOptions: {} }));

import { prisma } from '@/lib/prisma';
import { siguienteRegistro, peekNumeracion, esModuloValido } from '@/lib/numeradores';
import { GET as getNumeracion } from '@/app/api/numeradores/[modulo]/route';
import { setupCatalogo, limpiarCatalogo, type Catalogo } from './helpers/sacramentos-fixtures';

let cat: Catalogo;

function setSession(parishId: number | null, rol = 'administrador') {
  if (parishId === null) mockGetServerSession.mockResolvedValue(null);
  else mockGetServerSession.mockResolvedValue({ user: { id: '1', parishId: String(parishId), rol } });
}
function getReq(url = 'http://t/api'): NextRequest {
  return new Request(url) as unknown as NextRequest;
}
function ctx(modulo: string) {
  return { params: Promise.resolve({ modulo }) };
}
const reserva = (parishId: number, modulo: 'bautismo' | 'primera_comunion' | 'confirmacion' | 'matrimonio') =>
  prisma.$transaction((tx) => siguienteRegistro({ tx, parishId, modulo }));

beforeAll(async () => {
  cat = await setupCatalogo();
});
afterEach(async () => {
  await prisma.numeradores.deleteMany({});
  vi.clearAllMocks();
});
afterAll(async () => {
  await prisma.numeradores.deleteMany({});
  await limpiarCatalogo();
  await prisma.$disconnect();
});

describe('esModuloValido', () => {
  it('acepta módulos permitidos y rechaza otros', () => {
    expect(esModuloValido('bautismo')).toBe(true);
    expect(esModuloValido('defuncion')).toBe(false);
    expect(esModuloValido('foo')).toBe(false);
  });
});

describe('siguienteRegistro (atómico)', () => {
  it('incrementa secuencialmente', async () => {
    expect(await reserva(cat.parishA, 'bautismo')).toBe(1);
    expect(await reserva(cat.parishA, 'bautismo')).toBe(2);
    expect(await reserva(cat.parishA, 'bautismo')).toBe(3);
  });

  it('es independiente entre parroquias', async () => {
    expect(await reserva(cat.parishA, 'bautismo')).toBe(1);
    expect(await reserva(cat.parishB, 'bautismo')).toBe(1);
    expect(await reserva(cat.parishA, 'bautismo')).toBe(2);
  });

  it('es independiente entre módulos', async () => {
    expect(await reserva(cat.parishA, 'bautismo')).toBe(1);
    expect(await reserva(cat.parishA, 'matrimonio')).toBe(1);
    expect(await reserva(cat.parishA, 'bautismo')).toBe(2);
  });

  it('no produce colisiones bajo concurrencia', async () => {
    // Pre-crear la fila para que la concurrencia sólo ejercite el UPDATE atómico.
    await prisma.numeradores.create({ data: { id_parroquia: cat.parishA, modulo: 'confirmacion', scope: 'general', ultimo_registro: 0 } });
    const resultados = await Promise.all(Array.from({ length: 8 }, () => reserva(cat.parishA, 'confirmacion')));
    expect(new Set(resultados).size).toBe(8);
    expect(Math.max(...resultados)).toBe(8);
  });
});

describe('peekNumeracion', () => {
  it('sugiere el próximo registro sin mutar', async () => {
    await reserva(cat.parishA, 'bautismo'); // ultimo_registro = 1
    const s1 = await peekNumeracion(cat.parishA, 'bautismo');
    expect(s1.sugerido.numero_registro).toBe('2');
    const s2 = await peekNumeracion(cat.parishA, 'bautismo');
    expect(s2.ultimo_registro).toBe(1); // no mutó
  });
});

describe('GET /api/numeradores/[modulo]', () => {
  it('sin sesión -> 401', async () => {
    setSession(null);
    expect((await getNumeracion(getReq(), ctx('bautismo'))).status).toBe(401);
  });
  it('módulo inválido -> 400', async () => {
    setSession(cat.parishA);
    expect((await getNumeracion(getReq(), ctx('defuncion'))).status).toBe(400);
  });
  it('devuelve sugerencia del tenant de sesión', async () => {
    await reserva(cat.parishA, 'bautismo');
    setSession(cat.parishA);
    const res = await getNumeracion(getReq(), ctx('bautismo'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sugerido.numero_registro).toBe('2');
    // La parroquia B tiene su propio contador (no lo ve el tenant A).
    setSession(cat.parishB);
    const resB = await getNumeracion(getReq(), ctx('bautismo'));
    expect((await resB.json()).sugerido.numero_registro).toBe('1');
  });
});
