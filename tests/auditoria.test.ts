import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const { mockGetServerSession } = vi.hoisted(() => ({ mockGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockGetServerSession }));
vi.mock('@/lib/auth', () => ({ default: {}, authOptions: {} }));

import { prisma } from '@/lib/prisma';
import { GET as getAuditoria } from '@/app/api/auditoria/route';
import { setupCatalogo, limpiarCatalogo, type Catalogo } from './helpers/sacramentos-fixtures';

let cat: Catalogo;

function setSession(parishId: number | null, rol = 'administrador') {
  if (parishId === null) mockGetServerSession.mockResolvedValue(null);
  else mockGetServerSession.mockResolvedValue({ user: { id: '1', parishId: String(parishId), rol } });
}
function req(qs = ''): NextRequest {
  return new Request(`http://t/api/auditoria?${qs}`) as unknown as NextRequest;
}

beforeAll(async () => {
  cat = await setupCatalogo();
  const mk = (parishId: number, accion: string, tabla: string) =>
    prisma.bitacoraCrud.create({ data: { id_parroquia: parishId, id_usuario: BigInt(1), accion, nombre_tabla: tabla } });
  await mk(cat.parishA, 'C', 'persona');
  await mk(cat.parishA, 'U', 'persona');
  await mk(cat.parishA, 'C', 'bautismo');
  await mk(cat.parishB, 'C', 'persona');
});
afterAll(async () => {
  await prisma.bitacoraCrud.deleteMany({});
  await limpiarCatalogo();
  await prisma.$disconnect();
});

describe('GET /api/auditoria', () => {
  it('sin sesión -> 401', async () => {
    setSession(null);
    expect((await getAuditoria(req())).status).toBe(401);
  });
  it('sin permiso (solo lectura) -> 403', async () => {
    setSession(cat.parishA, 'solo lectura');
    expect((await getAuditoria(req())).status).toBe(403);
  });
  it('admin -> 200 y solo su tenant', async () => {
    setSession(cat.parishA);
    const json = await (await getAuditoria(req())).json();
    expect(json.total).toBe(3);
  });
  it('tenant B no ve A', async () => {
    setSession(cat.parishB);
    const json = await (await getAuditoria(req())).json();
    expect(json.total).toBe(1);
  });
  it('filtra por acción', async () => {
    setSession(cat.parishA);
    expect((await (await getAuditoria(req('accion=U'))).json()).total).toBe(1);
    expect((await (await getAuditoria(req('accion=C'))).json()).total).toBe(2);
  });
  it('filtra por tabla', async () => {
    setSession(cat.parishA);
    expect((await (await getAuditoria(req('tabla=bautismo'))).json()).total).toBe(1);
    expect((await (await getAuditoria(req('tabla=persona'))).json()).total).toBe(2);
  });
  it('pagina', async () => {
    setSession(cat.parishA);
    const json = await (await getAuditoria(req('pageSize=2&page=1'))).json();
    expect(json.data.length).toBe(2);
    expect(json.totalPages).toBe(2);
  });
});
