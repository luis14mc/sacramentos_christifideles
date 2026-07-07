import { NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { getReportesData } from '@/lib/reportes';

export async function GET() {
  try {
    const { parishId } = await requireTenantWithPermission(PAGES.REPORTES, 'ver');
    const data = await getReportesData(parishId);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
