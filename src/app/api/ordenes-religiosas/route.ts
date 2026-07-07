import { NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { prisma } from '@/lib/prisma';
import {
  handleApiError,
  requireTenantWithAnyPermission,
} from '@/lib/tenant';

export async function GET() {
  try {
    await requireTenantWithAnyPermission([
      [PAGES.PERSONAS, 'ver'],
      [PAGES.CONFIGURACION, 'ver'],
    ]);

    const ordenes = await prisma.ordenReligiosa.findMany({
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(ordenes);
  } catch (error) {
    return handleApiError(error);
  }
}
