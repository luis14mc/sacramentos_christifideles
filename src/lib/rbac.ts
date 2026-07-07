import { ForbiddenError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import type { PageUrl, PermissionAction } from '@/lib/pages';
import type { TenantContext } from '@/lib/tenant';

const FULL_ACCESS_ROLES = new Set([
  'super admin',
  'admin parroquia',
  'administrador',
]);

export function isFullAccessRole(roleName: string): boolean {
  return FULL_ACCESS_ROLES.has(roleName.toLowerCase());
}

const ACTION_FIELD: Record<
  PermissionAction,
  'puede_ver' | 'puede_crear' | 'puede_actualizar' | 'puede_borrar'
> = {
  ver: 'puede_ver',
  crear: 'puede_crear',
  actualizar: 'puede_actualizar',
  borrar: 'puede_borrar',
};

/** Respaldo cuando no hay filas en tr_rol_pagina (instalaciones legacy). */
const LEGACY_ROLE_PERMISSIONS: Record<
  string,
  Partial<Record<PageUrl, Partial<Record<PermissionAction, boolean>>>>
> = {
  parroco: {
    '/dashboard': { ver: true },
    '/personas': { ver: true, crear: true, actualizar: true, borrar: true },
    '/bautismos': { ver: true, crear: true, actualizar: true, borrar: true },
    '/primera-comunion': { ver: true, crear: true, actualizar: true, borrar: true },
    '/confirmaciones': { ver: true, crear: true, actualizar: true, borrar: true },
    '/matrimonios': { ver: true, crear: true, actualizar: true, borrar: true },
    '/constancias': { ver: true, crear: true },
    '/reportes': { ver: true },
    '/configuracion': { ver: true },
    '/usuarios': { ver: true },
  },
  secretario: {
    '/dashboard': { ver: true },
    '/personas': { ver: true, crear: true, actualizar: true, borrar: true },
    '/bautismos': { ver: true, crear: true, actualizar: true, borrar: true },
    '/primera-comunion': { ver: true, crear: true, actualizar: true, borrar: true },
    '/confirmaciones': { ver: true, crear: true, actualizar: true, borrar: true },
    '/matrimonios': { ver: true, crear: true, actualizar: true, borrar: true },
    '/constancias': { ver: true, crear: true },
    '/reportes': { ver: true },
    '/configuracion': { ver: true },
    '/usuarios': { ver: true },
  },
  catequista: {
    '/dashboard': { ver: true },
    '/personas': { ver: true },
    '/bautismos': { ver: true, crear: true, actualizar: true },
    '/primera-comunion': { ver: true, crear: true, actualizar: true },
    '/confirmaciones': { ver: true, crear: true, actualizar: true },
    '/constancias': { ver: true },
  },
  'solo lectura': {
    '/dashboard': { ver: true },
    '/personas': { ver: true },
    '/bautismos': { ver: true },
    '/primera-comunion': { ver: true },
    '/confirmaciones': { ver: true },
    '/matrimonios': { ver: true },
    '/constancias': { ver: true },
    '/reportes': { ver: true },
  },
};

function legacyAllows(
  roleName: string,
  pageUrl: PageUrl,
  action: PermissionAction
): boolean | null {
  const roleKey = roleName.toLowerCase();
  const perms = LEGACY_ROLE_PERMISSIONS[roleKey];
  if (!perms) return null;
  return perms[pageUrl]?.[action] === true;
}

export async function checkPermission(
  ctx: TenantContext,
  pageUrl: PageUrl,
  action: PermissionAction
): Promise<boolean> {
  if (isFullAccessRole(ctx.roleName)) {
    return true;
  }

  const perm = await prisma.trRolPagina.findFirst({
    where: {
      id_rol: ctx.roleId,
      pagina: { url: pageUrl, estado: 1 },
    },
  });

  if (perm) {
    return perm[ACTION_FIELD[action]] === 1;
  }

  const legacy = legacyAllows(ctx.roleName, pageUrl, action);
  if (legacy === true) return true;
  if (legacy === false) return false;

  return false;
}

export async function requirePermission(
  ctx: TenantContext,
  pageUrl: PageUrl,
  action: PermissionAction
): Promise<void> {
  if (!(await checkPermission(ctx, pageUrl, action))) {
    throw new ForbiddenError();
  }
}

export async function requireAnyPermission(
  ctx: TenantContext,
  checks: Array<[PageUrl, PermissionAction]>
): Promise<void> {
  for (const [pageUrl, action] of checks) {
    if (await checkPermission(ctx, pageUrl, action)) {
      return;
    }
  }
  throw new ForbiddenError();
}

export function requireSuperAdmin(roleName: string): void {
  const normalized = roleName.toLowerCase();
  if (normalized !== 'super admin' && normalized !== 'superadmin') {
    throw new ForbiddenError();
  }
}
