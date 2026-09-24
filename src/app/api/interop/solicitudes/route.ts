import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { contextoAuditoria, registrarBitacora } from '@/lib/bitacora';
import { ErrorHub, leerConfigInterop, llamarHub } from '@/lib/interop/cliente';
import {
  RUTAS_HUB,
  type NuevaSolicitudHub,
  type SolicitudRegistradaHub,
} from '@/lib/interop/contrato';
import { MAX_DNI, MAX_MOTIVO, serializarSolicitud, textoValido } from '@/lib/interop/solicitudes';

const ESTADOS = ['pendiente', 'aprobada', 'rechazada', 'error_envio'];

/** Bandejas: ?direccion=S (mis consultas) o ?direccion=E (consultas recibidas). */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.parishId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const parishId = parseInt(session.user.parishId, 10);
    if (Number.isNaN(parishId)) {
      return NextResponse.json({ error: 'Parroquia de sesión inválida' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const direccion = searchParams.get('direccion');
    const estado = searchParams.get('estado');
    if (direccion !== 'S' && direccion !== 'E') {
      return NextResponse.json({ error: 'direccion debe ser S o E' }, { status: 400 });
    }
    if (estado !== null && !ESTADOS.includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }
    const permiso = direccion === 'S' ? 'canSolicitarInterop' : 'canResolverInterop';
    if (!hasPermission(session.user.rol, permiso)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const solicitudes = await prisma.solicitudInterop.findMany({
      where: { id_parroquia: parishId, direccion, ...(estado ? { estado } : {}) },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
    return NextResponse.json(solicitudes.map(serializarSolicitud));
  } catch (error) {
    console.error('Error al listar solicitudes interop:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/** Crea una consulta a otra parroquia y la envía al hub. */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.parishId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(session.user.rol, 'canSolicitarInterop')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    const parishId = parseInt(session.user.parishId, 10);
    if (Number.isNaN(parishId)) {
      return NextResponse.json({ error: 'Parroquia de sesión inválida' }, { status: 400 });
    }

    const config = leerConfigInterop();
    if (!config) {
      return NextResponse.json(
        { error: 'La interoperabilidad no está configurada en esta parroquia' },
        { status: 503 }
      );
    }

    const data = await req.json().catch(() => null);
    const destino = textoValido(data?.destino, 50);
    const numeroIdentidad = textoValido(data?.numero_identidad, MAX_DNI);
    const motivo = textoValido(data?.motivo, MAX_MOTIVO);
    if (!destino || !numeroIdentidad || !motivo) {
      return NextResponse.json(
        { error: 'Faltan datos: parroquia destino, número de identidad y motivo' },
        { status: 400 }
      );
    }
    if (destino === config.codigo) {
      return NextResponse.json({ error: 'No puedes consultar a tu propia parroquia' }, { status: 400 });
    }

    const userId = BigInt(session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);

    const solicitud = await prisma.$transaction(async (tx) => {
      const creada = await tx.solicitudInterop.create({
        data: {
          id_parroquia: parishId,
          direccion: 'S',
          codigo_parroquia_contraparte: destino,
          numero_identidad_consultado: numeroIdentidad,
          motivo,
          id_usuario_solicitante: userId,
        },
      });
      await registrarBitacora(tx, {
        parishId,
        userId,
        accion: 'C',
        nombreTabla: 'solicitud_interop',
        idAfectado: creada.id_solicitud,
        newValues: { direccion: 'S', destino, numero_identidad: numeroIdentidad, motivo },
        actorIp,
        userAgent,
      });
      return creada;
    });

    try {
      const body: NuevaSolicitudHub = { destino, numero_identidad: numeroIdentidad, motivo };
      const registrada = await llamarHub<SolicitudRegistradaHub>(
        config,
        'POST',
        RUTAS_HUB.solicitudes,
        body
      );
      const actualizada = await prisma.solicitudInterop.update({
        where: { id_solicitud: solicitud.id_solicitud },
        data: { uuid: registrada.uuid, nombre_parroquia_contraparte: registrada.destino_nombre },
      });
      return NextResponse.json(serializarSolicitud(actualizada), { status: 201 });
    } catch (error) {
      if (!(error instanceof ErrorHub)) throw error;
      console.error('Envío de solicitud interop fallido:', error.message);
      const fallida = await prisma.solicitudInterop.update({
        where: { id_solicitud: solicitud.id_solicitud },
        data: { estado: 'error_envio' },
      });
      return NextResponse.json(
        {
          error: 'No se pudo entregar la consulta a la otra parroquia. Intenta más tarde.',
          solicitud: serializarSolicitud(fallida),
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Error al crear solicitud interop:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
