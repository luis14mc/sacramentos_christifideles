import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { cargarExpedientePersona } from '@/lib/expediente';

async function getParishContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parishId) return null;

  const parishId = parseInt(session.user.parishId, 10);
  if (Number.isNaN(parishId)) return null;

  return { session, parishId };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await getParishContext();
    if (!context) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(context.session.user.rol, 'canViewExpediente')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { id: numeroIdentidad } = await params;
    const expediente = await cargarExpedientePersona(context.parishId, numeroIdentidad);

    if (!expediente) {
      return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 });
    }

    return NextResponse.json(expediente);
  } catch (error) {
    console.error('Error al obtener expediente:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
