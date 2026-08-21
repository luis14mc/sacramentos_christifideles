import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { buscarGlobal } from '@/lib/busqueda';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.parishId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: NO_STORE });
    }
    if (!hasPermission(session.user.rol, 'canViewPersonas')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403, headers: NO_STORE });
    }
    const parishId = parseInt(session.user.parishId, 10);
    if (Number.isNaN(parishId)) {
      return NextResponse.json({ error: 'Parroquia de sesión inválida' }, { status: 400, headers: NO_STORE });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (q.length < 2) {
      return NextResponse.json(
        {
          personas: [],
          bautismos: [],
          primeras_comuniones: [],
          confirmaciones: [],
          matrimonios: [],
          total: 0,
        },
        { headers: NO_STORE }
      );
    }

    const resultados = await buscarGlobal(parishId, q);
    return NextResponse.json(resultados, { headers: NO_STORE });
  } catch (error) {
    console.error('Error en búsqueda global:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: NO_STORE });
  }
}
