import { describe, it, expect, afterAll, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const { mockGetServerSession } = vi.hoisted(() => ({ mockGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockGetServerSession }));
vi.mock('@/lib/auth', () => ({ default: {}, authOptions: {} }));

import { prisma } from '@/lib/prisma';
import { GET as getGrupos, POST as postGrupos } from '@/app/api/configuracion/grupos/route';
import { GET as getRoles, POST as postRoles } from '@/app/api/configuracion/roles/route';

function setSession(rol: string | null) {
  if (rol === null) mockGetServerSession.mockResolvedValue(null);
  else mockGetServerSession.mockResolvedValue({ user: { id: '1', parishId: '1', rol } });
}

function postReq(body: unknown): NextRequest {
  return new Request('http://t/api/configuracion/catalogo', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  }) as unknown as NextRequest;
}

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Autorización catálogos de configuración (grupos)', () => {
  it('sin sesión -> 401', async () => {
    setSession(null);
    expect((await getGrupos()).status).toBe(401);
    expect((await postGrupos(postReq({ nombre: 'X' }))).status).toBe(401);
  });

  it('GET sin canViewConfiguracion -> 403', async () => {
    setSession('catequista');
    expect((await getGrupos()).status).toBe(403);
  });

  it('POST sin canManageConfiguracion -> 403', async () => {
    setSession('secretario');
    expect((await postGrupos(postReq({ nombre: 'Coro' }))).status).toBe(403);
  });
});

describe('Autorización catálogos de configuración (roles)', () => {
  it('sin sesión -> 401', async () => {
    setSession(null);
    expect((await getRoles()).status).toBe(401);
    expect((await postRoles(postReq({ nombre: 'X' }))).status).toBe(401);
  });

  it('GET sin canViewConfiguracion -> 403', async () => {
    setSession('catequista');
    expect((await getRoles()).status).toBe(403);
  });

  it('POST sin canManageConfiguracion -> 403', async () => {
    setSession('secretario');
    expect((await postRoles(postReq({ nombre: 'Ministro' }))).status).toBe(403);
  });
});
