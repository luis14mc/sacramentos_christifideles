import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { ErrorHub, leerConfigInterop, llamarHub } from '@/lib/interop/cliente';
import { RUTAS_HUB, type InstanciaPublica } from '@/lib/interop/contrato';

/** Parroquias a las que se puede consultar (registradas en el hub, sin la propia). */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.parishId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(session.user.rol, 'canSolicitarInterop')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const config = leerConfigInterop();
    if (!config) {
      return NextResponse.json(
        { error: 'La interoperabilidad no está configurada en esta parroquia' },
        { status: 503 }
      );
    }

    const instancias = await llamarHub<InstanciaPublica[]>(config, 'GET', RUTAS_HUB.instancias);
    return NextResponse.json(instancias.filter((i) => i.codigo !== config.codigo));
  } catch (error) {
    if (error instanceof ErrorHub) {
      console.error('Hub no disponible al listar parroquias:', error.message);
      return NextResponse.json({ error: 'El hub de interoperabilidad no está disponible' }, { status: 502 });
    }
    console.error('Error al listar parroquias interop:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
