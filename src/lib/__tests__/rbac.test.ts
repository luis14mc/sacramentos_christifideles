import { describe, expect, it, vi, beforeEach } from 'vitest';
import { checkPermission } from '@/lib/rbac';
import type { TenantContext } from '@/lib/tenant';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    trRolPagina: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const mockFindFirst = vi.mocked(prisma.trRolPagina.findFirst);

function ctx(overrides: Partial<TenantContext> = {}): TenantContext {
  return {
    parishId: 1,
    userId: BigInt(1),
    roleId: 3,
    roleName: 'Secretario',
    ...overrides,
  };
}

describe('checkPermission', () => {
  beforeEach(() => {
    mockFindFirst.mockReset();
  });

  it('concede acceso total a Super Admin sin consultar BD', async () => {
    const allowed = await checkPermission(
      ctx({ roleName: 'Super Admin' }),
      '/personas',
      'borrar'
    );
    expect(allowed).toBe(true);
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it('usa tr_rol_pagina cuando existe registro', async () => {
    mockFindFirst.mockResolvedValue({
      id_rol: 3,
      id_pagina: 2,
      puede_ver: 1,
      puede_crear: 1,
      puede_actualizar: 0,
      puede_borrar: 0,
    });

    expect(
      await checkPermission(ctx(), '/personas', 'crear')
    ).toBe(true);
    expect(
      await checkPermission(ctx(), '/personas', 'borrar')
    ).toBe(false);
  });

  it('usa respaldo legacy para rol Secretario', async () => {
    mockFindFirst.mockResolvedValue(null);

    expect(
      await checkPermission(ctx({ roleName: 'Secretario' }), '/personas', 'ver')
    ).toBe(true);
    expect(
      await checkPermission(
        ctx({ roleName: 'Secretario' }),
        '/usuarios',
        'borrar'
      )
    ).toBe(false);
  });

  it('deniega rol desconocido sin permisos en BD', async () => {
    mockFindFirst.mockResolvedValue(null);

    expect(
      await checkPermission(
        ctx({ roleName: 'Invitado' }),
        '/personas',
        'ver'
      )
    ).toBe(false);
  });
});
