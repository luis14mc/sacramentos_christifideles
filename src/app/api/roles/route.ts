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
      [PAGES.USUARIOS, 'ver'],
      [PAGES.CONFIGURACION, 'ver'],
    ]);

    const roles = await prisma.rolUsuario.findMany({
      where: { estado: 1 },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(roles);
  } catch (error) {
    return handleApiError(error);
  }
}
