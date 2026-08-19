import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { getParroquiaData, getDashboardStats } from '@/lib/dashboard';
import { hasPermission } from '@/lib/permissions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.parishId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(session.user.rol, 'canViewDashboard')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const parishId = parseInt(session.user.parishId, 10);
    if (Number.isNaN(parishId)) {
      return NextResponse.json({ error: 'Contexto de parroquia inválido' }, { status: 401 });
    }

    const parroquiaData = await getParroquiaData(session.user.id, parishId);

    if (!parroquiaData) {
      return NextResponse.json(
        { error: 'Usuario o parroquia no encontrada' },
        { status: 404 }
      );
    }

    const stats = await getDashboardStats(parishId);

    return NextResponse.json({ parroquiaData, stats });
  } catch (error) {
    console.error('Error en API dashboard:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
