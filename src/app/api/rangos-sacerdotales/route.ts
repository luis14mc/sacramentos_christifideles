import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rangos = await prisma.rangoOrdenSacerdotal.findMany({
      include: { _count: { select: { orden_sacerdotal: true } } },
      orderBy: { nombre: 'asc' },
    });
    return NextResponse.json(rangos);
  } catch (error) {
    console.error('Error al listar rangos sacerdotales:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(session.user.rol, 'canManageConfiguracion')) {
      return NextResponse.json({ error: 'No tienes permiso para modificar catálogos' }, { status: 403 });
    }

    const data = await req.json();
    const nombre = typeof data.nombre === 'string' ? data.nombre.trim() : '';
    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }
    const descripcion =
      typeof data.descripcion === 'string' && data.descripcion.trim()
        ? data.descripcion.trim()
        : null;

    const creado = await prisma.rangoOrdenSacerdotal.create({
      data: { nombre, descripcion },
      include: { _count: { select: { orden_sacerdotal: true } } },
    });
    return NextResponse.json(creado, { status: 201 });
  } catch (error) {
    console.error('Error al crear rango sacerdotal:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
