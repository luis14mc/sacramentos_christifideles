import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const roles = await prisma.rolUsuario.findMany({
      where: {
        estado: 1 // Solo roles activos
      },
      select: {
        id_rol: true,
        nombre: true,
        descripcion: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    const rolesFormatted = roles.map(rol => ({
      id: rol.id_rol,
      nombre: rol.nombre,
      descripcion: rol.descripcion || ''
    }));

    return NextResponse.json(rolesFormatted);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
