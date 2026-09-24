import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { contextoAuditoria, registrarBitacora } from '@/lib/bitacora';
import { ErrorHub, leerConfigInterop, llamarHub } from '@/lib/interop/cliente';
import { RUTAS_HUB, type ResolucionSolicitud } from '@/lib/interop/contrato';
import { construirRespuestaConsulta } from '@/lib/interop/respuesta';
import { MAX_MOTIVO, serializarSolicitud, textoValido } from '@/lib/interop/solicitudes';

/**
 * Aprueba o rechaza una consulta entrante. Al aprobar se arman y envían los
 * datos mínimos (ver RespuestaConsulta); esta instancia no los guarda.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.parishId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(session.user.rol, 'canResolverInterop')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    const parishId = parseInt(session.user.parishId, 10);
    if (Number.isNaN(parishId)) {
      return NextResponse.json({ error: 'Parroquia de sesión inválida' }, { status: 400 });
    }

    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    const config = leerConfigInterop();
    if (!config) {
      return NextResponse.json(
        { error: 'La interoperabilidad no está configurada en esta parroquia' },
        { status: 503 }
      );
    }

    const data = await req.json().catch(() => null);
    const accion = data?.accion;
    if (accion !== 'aprobar' && accion !== 'rechazar') {
      return NextResponse.json({ error: 'accion debe ser aprobar o rechazar' }, { status: 400 });
    }
    const motivoRechazo = accion === 'rechazar' ? textoValido(data?.motivo_rechazo, MAX_MOTIVO) : null;
    if (accion === 'rechazar' && !motivoRechazo) {
      return NextResponse.json({ error: 'Indica el motivo del rechazo' }, { status: 400 });
    }

    const solicitud = await prisma.solicitudInterop.findFirst({
      where: { id_solicitud: BigInt(id), id_parroquia: parishId, direccion: 'E' },
    });
    if (!solicitud || !solicitud.uuid) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }
    if (solicitud.estado !== 'pendiente') {
      return NextResponse.json({ error: 'La solicitud ya fue resuelta' }, { status: 409 });
    }

    const resolucion: ResolucionSolicitud =
      accion === 'aprobar'
        ? {
            estado: 'aprobada',
            respuesta: await construirRespuestaConsulta(parishId, solicitud.numero_identidad_consultado),
          }
        : { estado: 'rechazada', motivo_rechazo: motivoRechazo! };

    try {
      await llamarHub(config, 'POST', RUTAS_HUB.respuesta(solicitud.uuid), resolucion);
    } catch (error) {
      if (!(error instanceof ErrorHub)) throw error;
      console.error('Envío de resolución interop fallido:', error.message);
      return NextResponse.json(
        { error: 'No se pudo entregar la respuesta. La solicitud sigue pendiente; intenta de nuevo.' },
        { status: 502 }
      );
    }

    const userId = BigInt(session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);
    const actualizada = await prisma.$transaction(async (tx) => {
      const res = await tx.solicitudInterop.update({
        where: { id_solicitud: solicitud.id_solicitud },
        data: {
          estado: resolucion.estado,
          motivo_rechazo: motivoRechazo,
          id_usuario_resolutor: userId,
          resuelta_at: new Date(),
        },
      });
      await registrarBitacora(tx, {
        parishId,
        userId,
        accion: 'U',
        nombreTabla: 'solicitud_interop',
        idAfectado: solicitud.id_solicitud,
        oldValues: { estado: 'pendiente' },
        newValues: {
          estado: resolucion.estado,
          origen: solicitud.codigo_parroquia_contraparte,
          numero_identidad: solicitud.numero_identidad_consultado,
          ...(resolucion.estado === 'aprobada'
            ? { encontrado: resolucion.respuesta.encontrado }
            : { motivo_rechazo: motivoRechazo }),
        },
        actorIp,
        userAgent,
      });
      return res;
    });

    return NextResponse.json(serializarSolicitud(actualizada));
  } catch (error) {
    console.error('Error al resolver solicitud interop:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
