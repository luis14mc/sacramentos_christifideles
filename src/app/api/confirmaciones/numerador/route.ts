import { NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope } from '@/lib/prisma-tenant';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { previewNextNumeracion } from '@/lib/numeradores';

export async function GET() {
  try {
    const { parishId } = await requireTenantWithPermission(PAGES.CONFIRMACIONES, 'crear');

    const numeracion = await withTenantScope(parishId, (db) =>
      previewNextNumeracion(db, parishId, 'confirmacion')
    );

    return NextResponse.json(numeracion);
  } catch (error) {
    return handleApiError(error);
  }
}
