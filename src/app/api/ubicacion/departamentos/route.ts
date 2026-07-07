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

    const departamentos = await prisma.departamento.findMany({
      orderBy: { nombre_departamento: 'asc' },
    });

    return NextResponse.json(departamentos);
  } catch (error) {
    return handleApiError(error);
  }
}
