import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(session.user.rol, 'canViewConfiguracion')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const grupos = await prisma.grupoParroquial.findMany({
      include: { _count: { select: { miembros: true } } },
      orderBy: { nombre: 'asc' },
    });
    return NextResponse.json(grupos);
  } catch (error) {
    console.error('Error al obtener grupos parroquiales:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(session.user.rol, 'canManageConfiguracion')) {
      return NextResponse.json({ error: 'No tienes permiso para modificar catálogos' }, { status: 403 });
    }

    const data = await req.json();
    const nuevoGrupo = await prisma.grupoParroquial.create({
      data: { nombre: data.nombre, descripcion: data.descripcion },
      include: { _count: { select: { miembros: true } } },
    });
    return NextResponse.json(nuevoGrupo, { status: 201 });
  } catch (error) {
    console.error('Error al crear grupo parroquial:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
