import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import authOptions from '@/lib/auth';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors';
import type { PageUrl, PermissionAction } from '@/lib/pages';
import { prisma } from '@/lib/prisma';
import { requireAnyPermission, requirePermission } from '@/lib/rbac';

export interface TenantContext {
  parishId: number;
  userId: bigint;
  roleId: number;
  roleName: string;
}

/** Obtiene el inquilino únicamente desde la sesión y revalida en BD. */
export async function requireTenantContext(): Promise<TenantContext> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.parishId) {
    throw new UnauthorizedError();
  }

  const parishId = Number(session.user.parishId);
  if (!Number.isInteger(parishId) || parishId <= 0) {
    throw new UnauthorizedError();
  }

  const user = await prisma.usuario.findFirst({
    where: {
      id_usuario: BigInt(session.user.id),
      id_parroquia: parishId,
      estado: 1,
    },
    select: {
      id_usuario: true,
      id_rol: true,
      rol: { select: { nombre: true } },
    },
  });

  if (!user) {
    throw new ForbiddenError();
  }

  return {
    parishId,
    userId: user.id_usuario,
    roleId: user.id_rol,
    roleName: user.rol.nombre,
  };
}

/** Tenant + permiso RBAC desde tr_rol_pagina (servidor). */
export async function requireTenantWithPermission(
  pageUrl: PageUrl,
  action: PermissionAction
): Promise<TenantContext> {
  const ctx = await requireTenantContext();
  await requirePermission(ctx, pageUrl, action);
  return ctx;
}

/** Tenant + al menos uno de los permisos indicados. */
export async function requireTenantWithAnyPermission(
  checks: Array<[PageUrl, PermissionAction]>
): Promise<TenantContext> {
  const ctx = await requireTenantContext();
  await requireAnyPermission(ctx, checks);
  return ctx;
}

/** Rechaza si el cliente intenta operar sobre otra parroquia. */
export function assertParishAccess(
  requestedParishId: number | undefined | null,
  tenantParishId: number
): void {
  if (
    requestedParishId !== undefined &&
    requestedParishId !== null &&
    Number(requestedParishId) !== tenantParishId
  ) {
    throw new ForbiddenError();
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }
  logger.error(error);
  return NextResponse.json(
    { error: 'Error interno del servidor' },
    { status: 500 }
  );
}
