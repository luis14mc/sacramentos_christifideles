import { NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { prisma } from '@/lib/prisma';
import { RANGOS_MINISTERIALES } from '@/lib/sacerdote';
import { handleApiError, requireTenantWithAnyPermission } from '@/lib/tenant';

export async function GET() {
  try {
    await requireTenantWithAnyPermission([
      [PAGES.CONFIGURACION, 'ver'],
      [PAGES.PERSONAS, 'ver'],
      [PAGES.BAUTISMOS, 'ver'],
      [PAGES.PRIMERA_COMUNION, 'ver'],
      [PAGES.CONFIRMACIONES, 'ver'],
      [PAGES.MATRIMONIOS, 'ver'],
    ]);

    const rangos = await prisma.rangoOrdenSacerdotal.findMany({
      where: {
        nombre: { in: [...RANGOS_MINISTERIALES] },
      },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(rangos);
  } catch (error) {
    return handleApiError(error);
  }
}
