import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { peekNumeracion, esModuloValido, SCOPE_DEFAULT } from '@/lib/numeradores';

// Sugerencia de numeración para el módulo, dentro de la parroquia de sesión.
// El tenant proviene SIEMPRE de la sesión; el cliente no puede elegir parroquia.
export async function GET(req: NextRequest, { params }: { params: Promise<{ modulo: string }> }) {
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

    const { modulo } = await params;
    if (!esModuloValido(modulo)) {
      return NextResponse.json({ error: 'Módulo de numeración inválido' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope')?.trim() || SCOPE_DEFAULT;

    const sugerencia = await peekNumeracion(parishId, modulo, scope);
    return NextResponse.json(sugerencia);
  } catch (error) {
    console.error('Error al obtener numeración:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
