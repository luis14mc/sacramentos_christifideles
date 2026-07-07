import { NextResponse } from 'next/server';
import { resolveUserPermissions } from '@/lib/permissions-map';
import { handleApiError, requireTenantContext } from '@/lib/tenant';

export async function GET() {
  try {
    const ctx = await requireTenantContext();
    const permissions = await resolveUserPermissions(ctx);

    return NextResponse.json({
      permissions,
      role: ctx.roleName,
      parishId: ctx.parishId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
