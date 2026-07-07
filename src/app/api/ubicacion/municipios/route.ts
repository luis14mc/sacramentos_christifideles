import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { prisma } from '@/lib/prisma';
import {
  handleApiError,
  requireTenantWithAnyPermission,
} from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    await requireTenantWithAnyPermission([
      [PAGES.PERSONAS, 'ver'],
      [PAGES.CONFIGURACION, 'ver'],
    ]);

    const { searchParams } = new URL(req.url);
    const departamento = searchParams.get('departamento');

    if (!departamento) {
      return NextResponse.json(
        { error: 'Parámetro departamento requerido' },
        { status: 400 }
      );
    }

    const municipios = await prisma.municipio.findMany({
      where: { codigo_departamento: departamento },
      orderBy: { nombre_municipio: 'asc' },
    });

    return NextResponse.json(municipios);
  } catch (error) {
    return handleApiError(error);
  }
}
