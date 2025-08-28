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
    const departamento = searchParams.get('departamento');

    if (!departamento) {
      return NextResponse.json({ error: 'Parámetro departamento requerido' }, { status: 400 });
    }

    const municipios = await prisma.municipio.findMany({
      where: {
        codigo_departamento: departamento
      },
      orderBy: {
        nombre_municipio: 'asc'
      }
    });

    return NextResponse.json(municipios);
  } catch (error) {
    console.error('Error al obtener municipios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
