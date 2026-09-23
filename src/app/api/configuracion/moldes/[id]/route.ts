import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { contextoAuditoria, registrarBitacora } from '@/lib/bitacora';
import { obtenerMoldePorId } from '@/lib/constancias/moldes';

async function getContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parishId) return null;
  const parishId = parseInt(session.user.parishId, 10);
  if (Number.isNaN(parishId)) return null;
  return { session, parishId };
}

function parseId(id: string): bigint | null {
  try {
    return BigInt(id);
  } catch {
    return null;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canViewConfiguracion')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    const { id: idStr } = await params;
    const id = parseId(idStr);
    if (id === null) return NextResponse.json({ error: 'Molde no encontrado' }, { status: 404 });
    const molde = await obtenerMoldePorId(context.parishId, id);
    if (!molde) return NextResponse.json({ error: 'Molde no encontrado' }, { status: 404 });
    return new NextResponse(Buffer.from(molde.archivo), {
      status: 200,
      headers: {
        'Content-Type': molde.archivo_mime || 'application/pdf',
        'Content-Disposition': `inline; filename="${molde.archivo_nombre}"`,
        'Cache-Control': 'private, max-age=0, no-store',
      },
    });
  } catch (error) {
    console.error('Error al descargar molde:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canManageConfiguracion')) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar moldes' }, { status: 403 });
    }
    const { id: idStr } = await params;
    const id = parseId(idStr);
    if (id === null) return NextResponse.json({ error: 'Molde no encontrado' }, { status: 404 });

    const existente = await prisma.moldeConstancia.findFirst({
      where: { id, id_parroquia: context.parishId },
    });
    if (!existente) return NextResponse.json({ error: 'Molde no encontrado' }, { status: 404 });

    const userId = BigInt(context.session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);

    await prisma.$transaction(async (tx) => {
      const { count } = await tx.moldeConstancia.deleteMany({
        where: { id, id_parroquia: context.parishId },
      });
      if (count === 0) throw new Error('MOLDE_FUERA_DE_ALCANCE');
      await registrarBitacora(tx, {
        parishId: context.parishId,
        userId,
        accion: 'D',
        nombreTabla: 'molde_constancia',
        idAfectado: id,
        oldValues: { nombre: existente.nombre, sacramento: existente.sacramento, tipo_constancia: existente.tipo_constancia },
        actorIp,
        userAgent,
      });
    });

    return NextResponse.json({ message: 'Molde eliminado correctamente' });
  } catch (error) {
    if (error instanceof Error && error.message === 'MOLDE_FUERA_DE_ALCANCE') {
      return NextResponse.json({ error: 'Molde no encontrado' }, { status: 404 });
    }
    console.error('Error al eliminar molde:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
