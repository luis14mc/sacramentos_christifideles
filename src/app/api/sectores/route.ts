import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.parishId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (
      !hasPermission(session.user.rol, 'canViewPersonas') &&
      !hasPermission(session.user.rol, 'canViewSacramentos') &&
      !hasPermission(session.user.rol, 'canViewConfiguracion')
    ) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const parishId = parseInt(session.user.parishId, 10);
    if (Number.isNaN(parishId)) {
      return NextResponse.json({ error: 'Contexto de parroquia inválido' }, { status: 401 });
    }

    const sectores = await prisma.sectorParroquial.findMany({
      where: {
        id_parroquia: parishId
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    const sectoresSerializados = sectores.map(sector => ({
      ...sector,
      id_sector_parroquial: sector.id_sector_parroquial.toString()
    }));

    return NextResponse.json(sectoresSerializados);
  } catch (error) {
    console.error('Error al obtener sectores parroquiales:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
