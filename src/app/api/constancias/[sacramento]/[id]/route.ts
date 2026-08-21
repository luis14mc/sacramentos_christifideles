import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { contextoAuditoria } from '@/lib/bitacora';
import {
  esSacramentoConstancia,
  cargarDatosConstancia,
  obtenerPlantilla,
  generarConstanciaPdf,
} from '@/lib/constancias';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sacramento: string; id: string }> }
) {
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

    const { sacramento, id } = await params;
    if (!esSacramentoConstancia(sacramento)) {
      return NextResponse.json({ error: 'Sacramento inválido' }, { status: 400 });
    }
    let idRegistro: bigint;
    try {
      idRegistro = BigInt(id);
    } catch {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    // Se leen todos los datos del servidor; el cliente solo indica sacramento e id.
    const datos = await cargarDatosConstancia(parishId, sacramento, idRegistro);
    if (!datos) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    const contenido = await obtenerPlantilla(parishId, sacramento);
    const pdf = await generarConstanciaPdf(datos, contenido);

    // Auditoría de emisión (acción 'R'). Best-effort: no bloquea la entrega.
    try {
      const { actorIp, userAgent } = contextoAuditoria(req);
      await prisma.bitacoraCrud.create({
        data: {
          id_parroquia: parishId,
          id_usuario: BigInt(session.user.id),
          accion: 'R',
          nombre_tabla: 'constancia',
          id_tabla_afectado: idRegistro,
          new_values: { sacramento, id: datos.id },
          actor_ip: actorIp,
          user_agent: userAgent,
        },
      });
    } catch (e) {
      console.error('No se pudo auditar emisión de constancia:', e);
    }

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="constancia-${sacramento}-${datos.id}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error al generar constancia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
