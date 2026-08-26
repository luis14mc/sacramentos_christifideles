import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(session.user.rol, 'canManageConfiguracion')) {
      return NextResponse.json({ error: 'No tienes permiso para modificar catálogos' }, { status: 403 });
    }

    const { id } = await params;
    const idRango = Number(id);
    if (!Number.isInteger(idRango)) {
      return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 });
    }

    const existente = await prisma.rangoOrdenSacerdotal.findUnique({
      where: { id_rango_sacerdotal: idRango },
    });
    if (!existente) {
      return NextResponse.json({ error: 'Rango sacerdotal no encontrado' }, { status: 404 });
    }

    const data = await req.json();
    const nombre =
      typeof data.nombre === 'string' && data.nombre.trim() ? data.nombre.trim() : existente.nombre;
    const descripcion =
      data.descripcion === undefined
        ? existente.descripcion
        : typeof data.descripcion === 'string' && data.descripcion.trim()
          ? data.descripcion.trim()
          : null;

    const actualizado = await prisma.rangoOrdenSacerdotal.update({
      where: { id_rango_sacerdotal: idRango },
      data: { nombre, descripcion },
      include: { _count: { select: { orden_sacerdotal: true } } },
    });
    return NextResponse.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar rango sacerdotal:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
