import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const municipio = searchParams.get('municipio');

    console.log('🔍 API Sectores - Municipio solicitado:', municipio);

    let sectores;

    if (municipio) {
      // Filtrar sectores por municipio a través de las parroquias
      sectores = await prisma.sectorParroquial.findMany({
        where: {
          parroquia: {
            ubicacion: municipio
          }
        },
        orderBy: {
          nombre: 'asc'
        }
      });
      console.log(`🔍 API Sectores - Filtrados para municipio ${municipio}:`, sectores.length);
    } else {
      // Devolver todos los sectores si no se especifica municipio
      sectores = await prisma.sectorParroquial.findMany({
        orderBy: {
          nombre: 'asc'
        }
      });
      console.log('🔍 API Sectores - Todos los sectores:', sectores.length);
    }

    console.log('🔍 API Sectores - Primeros 3:', sectores.slice(0, 3).map(s => s.nombre));

    // Convertir BigInt a string para la serialización JSON
    const sectoresSerializados = sectores.map(sector => ({
      ...sector,
      id_sector_parroquial: sector.id_sector_parroquial.toString(),
      id_parroquia: sector.id_parroquia
    }));

    console.log('🔍 API Sectores - Retornando:', sectoresSerializados.length, 'sectores');

    return NextResponse.json(sectoresSerializados);
  } catch (error) {
    console.error('Error al obtener sectores parroquiales:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
