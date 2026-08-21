import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { consultarLibro, esSacramentoValido, type LibroFiltros } from '@/lib/libros';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.parishId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(session.user.rol, 'canViewSacramentos')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    const parishId = parseInt(session.user.parishId, 10);
    if (Number.isNaN(parishId)) {
      return NextResponse.json({ error: 'Parroquia de sesión inválida' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const sacramento = (searchParams.get('sacramento') || '').trim();
    if (!esSacramentoValido(sacramento)) {
      return NextResponse.json({ error: 'Sacramento inválido' }, { status: 400 });
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));

    const filtros: LibroFiltros = {
      libro: searchParams.get('libro')?.trim() || undefined,
      pagina: searchParams.get('pagina')?.trim() || undefined,
      registro: searchParams.get('registro')?.trim() || undefined,
      dni: searchParams.get('dni')?.trim() || undefined,
      nombre: searchParams.get('q')?.trim() || undefined,
    };

    const resultado = await consultarLibro(parishId, sacramento, filtros, page, pageSize);
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error al consultar libro:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
