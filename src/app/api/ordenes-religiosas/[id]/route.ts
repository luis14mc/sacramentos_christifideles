import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

const RAMAS = new Set(['F', 'M', 'N']);

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
    const idOrden = Number(id);
    if (!Number.isInteger(idOrden)) {
      return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 });
    }

    const existente = await prisma.ordenReligiosa.findUnique({
      where: { id_orden_religiosa: idOrden },
    });
    if (!existente) {
      return NextResponse.json({ error: 'Orden religiosa no encontrada' }, { status: 404 });
    }

    const data = await req.json();
    const nombre =
      typeof data.nombre === 'string' && data.nombre.trim() ? data.nombre.trim() : existente.nombre;
    const ramaRaw = typeof data.rama === 'string' ? data.rama.trim().toUpperCase() : existente.rama;
    if (!RAMAS.has(ramaRaw)) {
      return NextResponse.json({ error: 'Rama inválida (debe ser F, M o N)' }, { status: 400 });
    }

    const actualizada = await prisma.ordenReligiosa.update({
      where: { id_orden_religiosa: idOrden },
      data: {
        nombre,
        rama: ramaRaw,
        nombre_latin:
          data.nombre_latin === undefined
            ? existente.nombre_latin
            : typeof data.nombre_latin === 'string'
              ? data.nombre_latin.trim() || null
              : null,
        abreviatura:
          data.abreviatura === undefined
            ? existente.abreviatura
            : typeof data.abreviatura === 'string'
              ? data.abreviatura.trim() || null
              : null,
        descripcion:
          data.descripcion === undefined
            ? existente.descripcion
            : typeof data.descripcion === 'string'
              ? data.descripcion.trim() || null
              : null,
      },
      include: { _count: { select: { orden_sacerdotal: true, personas: true } } },
    });
    return NextResponse.json(actualizada);
  } catch (error) {
    console.error('Error al actualizar orden religiosa:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
