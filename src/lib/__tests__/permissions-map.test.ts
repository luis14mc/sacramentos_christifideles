import { describe, expect, it, vi, beforeEach } from 'vitest';
import { resolveUserPermissions } from '@/lib/permissions-map';
import { fullPermissions } from '@/types/permissions';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    trRolPagina: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const mockFindMany = vi.mocked(prisma.trRolPagina.findMany);

describe('resolveUserPermissions', () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it('otorga acceso total a Super Admin', async () => {
    const perms = await resolveUserPermissions({
      parishId: 1,
      userId: BigInt(1),
      roleId: 1,
      roleName: 'Super Admin',
    });
    expect(perms).toEqual(fullPermissions);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('mapea permisos desde tr_rol_pagina', async () => {
    mockFindMany.mockResolvedValue([
      {
        id_rol: 5,
        id_pagina: 1,
        puede_ver: 1,
        puede_crear: 0,
        puede_actualizar: 0,
        puede_borrar: 0,
        pagina: { url: '/dashboard' },
      },
      {
        id_rol: 5,
        id_pagina: 2,
        puede_ver: 1,
        puede_crear: 0,
        puede_actualizar: 0,
        puede_borrar: 0,
        pagina: { url: '/personas' },
      },
    ] as never);

    const perms = await resolveUserPermissions({
      parishId: 1,
      userId: BigInt(2),
      roleId: 5,
      roleName: 'Solo Lectura',
    });

    expect(perms.canViewDashboard).toBe(true);
    expect(perms.canViewPersonas).toBe(true);
    expect(perms.canManagePersonas).toBe(false);
    expect(perms.canViewUsuarios).toBe(false);
  });

  it('usa respaldo legacy cuando no hay filas en BD', async () => {
    mockFindMany.mockResolvedValue([]);

    const perms = await resolveUserPermissions({
      parishId: 1,
      userId: BigInt(3),
      roleId: 4,
      roleName: 'Catequista',
    });

    expect(perms.canViewPersonas).toBe(true);
    expect(perms.canCreateSacramentos).toBe(true);
    expect(perms.canViewUsuarios).toBe(false);
  });
});
