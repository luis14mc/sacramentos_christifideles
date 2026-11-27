import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

/**
 * GET: quién puede firmar las certificaciones de la parroquia de la sesión
 * (párroco y vicario parroquial). Lo usa el botón de emisión para ofrecer
 * la elección. Solo nombres; nada sensible.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.parishId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(session.user.rol, 'canGenerateConstancias')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    const parishId = parseInt(session.user.parishId, 10);
    if (Number.isNaN(parishId)) {
      return NextResponse.json({ error: 'Parroquia de sesión inválida' }, { status: 400 });
    }
    const config = await prisma.parroquiaConfig.findUnique({
      where: { id_parroquia: parishId },
      select: { parroco_nombre: true, vicario_nombre: true },
    });
    return NextResponse.json({
      parroco: config?.parroco_nombre?.trim() || null,
      vicario: config?.vicario_nombre?.trim() || null,
    });
  } catch (error) {
    console.error('Error al obtener firmantes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
