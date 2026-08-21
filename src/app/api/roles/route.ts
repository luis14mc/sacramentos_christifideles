import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const roles = await prisma.rolUsuario.findMany({
      where: { estado: 1 },
      select: { id_rol: true, nombre: true, descripcion: true },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(
      roles.map((rol) => ({ id: rol.id_rol, nombre: rol.nombre, descripcion: rol.descripcion || '' }))
    );
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
