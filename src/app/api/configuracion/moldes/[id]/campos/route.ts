import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { obtenerMoldePorId } from '@/lib/constancias/moldes';
import { listarCamposAcroForm } from '@/lib/constancias/moldes';

async function getContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parishId) return null;
  const parishId = parseInt(session.user.parishId, 10);
  if (Number.isNaN(parishId)) return null;
  return { session, parishId };
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
    let id: bigint;
    try {
      id = BigInt(idStr);
    } catch {
      return NextResponse.json({ error: 'Molde no encontrado' }, { status: 404 });
    }
    const molde = await obtenerMoldePorId(context.parishId, id);
    if (!molde) return NextResponse.json({ error: 'Molde no encontrado' }, { status: 404 });
    const campos = await listarCamposAcroForm(molde.archivo);
    return NextResponse.json({ campos });
  } catch (error) {
    console.error('Error al listar campos del molde:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
