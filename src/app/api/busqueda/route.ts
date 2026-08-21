import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { buscarGlobal } from '@/lib/busqueda';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.parishId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(session.user.rol, 'canViewPersonas')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    const parishId = parseInt(session.user.parishId, 10);
    if (Number.isNaN(parishId)) {
      return NextResponse.json({ error: 'Parroquia de sesión inválida' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (q.length < 2) {
      return NextResponse.json({
        personas: [],
        bautismos: [],
        primeras_comuniones: [],
        confirmaciones: [],
        matrimonios: [],
        total: 0,
      });
    }

    const resultados = await buscarGlobal(parishId, q);
    return NextResponse.json(resultados);
  } catch (error) {
    console.error('Error en búsqueda global:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
