import { NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { getParroquiaData, getDashboardStats } from '@/lib/dashboard';
import { ForbiddenError } from '@/lib/errors';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';

export async function GET() {
  try {
    const { parishId, userId } = await requireTenantWithPermission(
      PAGES.DASHBOARD,
      'ver'
    );

    const parroquiaData = await getParroquiaData(userId.toString());

    if (!parroquiaData || parroquiaData.parroquia.id !== parishId) {
      throw new ForbiddenError();
    }

    const stats = await getDashboardStats(parishId);

    return NextResponse.json({ parroquiaData, stats });
  } catch (error) {
    return handleApiError(error);
  }
}
