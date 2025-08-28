import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ordenes = await prisma.ordenReligiosa.findMany({
      orderBy: {
        nombre: 'asc'
      }
    });

    return NextResponse.json(ordenes);
  } catch (error) {
    console.error('Error al obtener órdenes religiosas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
