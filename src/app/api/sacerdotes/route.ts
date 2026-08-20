import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// Listado de ministros de la parroquia para selección en sacramentos.
// Tenant-safe y accesible a quien puede ver sacramentos (no requiere
// permiso de configuración, para no bloquear a secretaría en el alta).
export async function GET() {
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

    const sacerdotes = await prisma.ordenSacerdotal.findMany({
      where: { id_parroquia: parishId },
      select: {
        numero_identidad: true,
        nombres: true,
        apellidos: true,
        es_parroco: true,
        rango: { select: { nombre: true } },
      },
      orderBy: [{ es_parroco: 'desc' }, { apellidos: 'asc' }, { nombres: 'asc' }],
    });

    return NextResponse.json(sacerdotes);
  } catch (error) {
    console.error('Error al listar sacerdotes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
