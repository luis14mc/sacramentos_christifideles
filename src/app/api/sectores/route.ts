import { NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope } from '@/lib/prisma-tenant';
import {
  handleApiError,
  requireTenantWithAnyPermission,
} from '@/lib/tenant';

export async function GET() {
  try {
    const { parishId } = await requireTenantWithAnyPermission([
      [PAGES.PERSONAS, 'ver'],
      [PAGES.CONFIGURACION, 'ver'],
    ]);

    const sectores = await withTenantScope(parishId, (db) =>
      db.sectorParroquial.findMany({
        where: { id_parroquia: parishId },
        orderBy: { nombre: 'asc' },
      })
    );

    const sectoresSerializados = sectores.map((sector) => ({
      ...sector,
      id_sector_parroquial: sector.id_sector_parroquial.toString(),
      id_parroquia: sector.id_parroquia,
    }));

    return NextResponse.json(sectoresSerializados);
  } catch (error) {
    return handleApiError(error);
  }
}
