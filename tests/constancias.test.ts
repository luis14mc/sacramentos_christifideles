import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const { mockGetServerSession } = vi.hoisted(() => ({ mockGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockGetServerSession }));
vi.mock('@/lib/auth', () => ({ default: {}, authOptions: {} }));

import { prisma } from '@/lib/prisma';
import { GET as getConstancia } from '@/app/api/constancias/[sacramento]/[id]/route';
import { renderPlantilla, plantillaDefault, construirTokens, type ConstanciaData } from '@/lib/constancias';
import { setupCatalogo, seedPersona, seedSacerdote, limpiarCatalogo, type Catalogo } from './helpers/sacramentos-fixtures';

let cat: Catalogo;
let idBautismo: string;
let idMatrimonio: string;
const SAC = 'SAC-A';
const A = { bz: 'BZ1', md: 'MD1', pd: 'PD1', mn: 'MN1', pn: 'PN1', ct: 'CT1' };

function setSession(parishId: number | null, rol = 'administrador') {
  if (parishId === null) mockGetServerSession.mockResolvedValue(null);
  else mockGetServerSession.mockResolvedValue({ user: { id: '1', parishId: String(parishId), rol } });
}
function getReq(): NextRequest {
  return new Request('http://t/api/constancias') as unknown as NextRequest;
}
function ctx(sacramento: string, id: string) {
  return { params: Promise.resolve({ sacramento, id }) };
}

beforeAll(async () => {
  cat = await setupCatalogo();
  for (const dni of Object.values(A)) await seedPersona(cat.parishA, dni, cat.sectorA, cat.ordenId);
  await seedSacerdote(cat.parishA, SAC, cat.rangoId, cat.ordenId);
  const b = await prisma.bautismo.create({
    data: {
      id_parroquia: cat.parishA,
      numero_identidad_bautizado: A.bz, numero_identidad_madre: A.md, numero_identidad_padre: A.pd,
      numero_identidad_madrina: A.mn, numero_identidad_padrino: A.pn, numero_identidad_catequista: A.ct,
      numero_identidad_sacerdote: SAC, fecha_bautismo: new Date('2026-05-01'),
      numero_folio: '1', numero_libro: '1', numero_pagina: '1', numero_registro: '1',
    },
  });
  idBautismo = b.id_bautismo.toString();
  const m = await prisma.matrimonio.create({
    data: {
      id_parroquia: cat.parishA,
      numero_identidad_esposa: A.bz, numero_identidad_esposo: A.md,
      numero_identidad_madrina: A.mn, numero_identidad_padrino: A.pn, numero_identidad_sacerdote: SAC,
      fecha_matrimonio: new Date('2026-05-02'), numero_acta: '1', numero_libro: '1', numero_pagina: '1', numero_registro: '1',
    },
  });
  idMatrimonio = m.id_matrimonio.toString();
});
afterAll(async () => {
  await prisma.bitacoraCrud.deleteMany({});
  await prisma.plantillaConstancia.deleteMany({});
  await prisma.matrimonio.deleteMany({});
  await prisma.bautismo.deleteMany({});
  await limpiarCatalogo();
  await prisma.$disconnect();
});

async function esPdf(res: Response): Promise<boolean> {
  expect(res.headers.get('content-type')).toBe('application/pdf');
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.subarray(0, 4).toString('latin1') === '%PDF';
}

describe('GET /api/constancias/[sacramento]/[id]', () => {
  it('sin sesión -> 401', async () => {
    setSession(null);
    expect((await getConstancia(getReq(), ctx('bautismo', idBautismo))).status).toBe(401);
  });
  it('sin permiso (rol sin canViewSacramentos) -> 403', async () => {
    setSession(cat.parishA, 'guest');
    expect((await getConstancia(getReq(), ctx('bautismo', idBautismo))).status).toBe(403);
  });
  it('recurso propio -> 200 y application/pdf', async () => {
    setSession(cat.parishA);
    const res = await getConstancia(getReq(), ctx('bautismo', idBautismo));
    expect(res.status).toBe(200);
    expect(await esPdf(res)).toBe(true);
  });
  it('cross-tenant -> 404', async () => {
    setSession(cat.parishB);
    expect((await getConstancia(getReq(), ctx('bautismo', idBautismo))).status).toBe(404);
  });
  it('sacramento inválido -> 400', async () => {
    setSession(cat.parishA);
    expect((await getConstancia(getReq(), ctx('defuncion', idBautismo))).status).toBe(400);
  });
  it('id inexistente -> 404', async () => {
    setSession(cat.parishA);
    expect((await getConstancia(getReq(), ctx('bautismo', '99999999'))).status).toBe(404);
  });
  it('usa plantilla activa cuando existe -> 200 pdf', async () => {
    await prisma.plantillaConstancia.create({ data: { id_parroquia: cat.parishA, sacramento: 'bautismo', nombre: 'Oficial', contenido: 'Consta {{persona.nombre_completo}} libro {{libro}}.', activo: true } });
    setSession(cat.parishA);
    const res = await getConstancia(getReq(), ctx('bautismo', idBautismo));
    expect(res.status).toBe(200);
    expect(await esPdf(res)).toBe(true);
    await prisma.plantillaConstancia.deleteMany({});
  });
  it('fallback sin plantilla -> 200 pdf', async () => {
    setSession(cat.parishA);
    const res = await getConstancia(getReq(), ctx('matrimonio', idMatrimonio));
    expect(res.status).toBe(200);
    expect(await esPdf(res)).toBe(true);
  });
  it('funciona sin logo/sello configurado -> 200', async () => {
    setSession(cat.parishA);
    expect((await getConstancia(getReq(), ctx('bautismo', idBautismo))).status).toBe(200);
  });
});

describe('render de plantilla (contenido)', () => {
  it('reemplaza placeholders y no ejecuta código', () => {
    const tokens = { 'persona.nombre_completo': 'Juan Pérez', libro: '3' };
    expect(renderPlantilla('Hola {{persona.nombre_completo}} libro {{libro}} {{desconocido}}', tokens)).toBe('Hola Juan Pérez libro 3 ');
  });
  it('la constancia de Matrimonio incluye a ambos contrayentes', () => {
    const datos = {
      sacramento: 'matrimonio',
      id: '1',
      parroquia: { nombre: 'P', direccion: 'D', telefono: 'T' },
      aliasLiturgico: null,
      tz: 'America/Tegucigalpa',
      personaPrincipal: { numero_identidad: '1', nombres: 'Ana', apellidos: 'Gómez' },
      conyuge: { numero_identidad: '2', nombres: 'Luis', apellidos: 'Díaz' },
      ministro: { numero_identidad: '9', nombres: 'Padre', apellidos: 'X' },
      fecha: new Date('2026-05-02'),
      numero_acta: '1', numero_libro: '1', numero_pagina: '1', numero_registro: '1', nota_marginal: null,
    } as ConstanciaData;
    const texto = renderPlantilla(plantillaDefault('matrimonio'), construirTokens(datos));
    expect(texto).toContain('Ana Gómez');
    expect(texto).toContain('Luis Díaz');
  });
});
