import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { leerConfigInterop, verificarPeticionHub } from '@/lib/interop/cliente';
import { MAX_MOTIVO, textoValido } from '@/lib/interop/solicitudes';

/**
 * Recibe la resolución de una consulta saliente (solo desde el hub, firmada).
 * Idempotente: repetir la misma resolución devuelve 200 sin cambios.
 */
export async function POST(req: NextRequest) {
  const config = leerConfigInterop();
  if (!config) {
    return NextResponse.json({ error: 'Interoperabilidad no configurada' }, { status: 503 });
  }

  const cuerpo = await req.text();
  if (!verificarPeticionHub(config, req, cuerpo)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const data = JSON.parse(cuerpo);
    const uuid = typeof data?.uuid === 'string' ? data.uuid : null;
    const estado = data?.estado;
    if (!uuid || (estado !== 'aprobada' && estado !== 'rechazada')) {
      return NextResponse.json({ error: 'Respuesta inválida' }, { status: 400 });
    }
    const motivoRechazo = estado === 'rechazada' ? textoValido(data?.motivo_rechazo, MAX_MOTIVO) : null;
    const respuesta = estado === 'aprobada' ? data?.respuesta : null;
    if (estado === 'aprobada' && (typeof respuesta !== 'object' || respuesta === null)) {
      return NextResponse.json({ error: 'Respuesta inválida' }, { status: 400 });
    }

    const solicitud = await prisma.solicitudInterop.findFirst({
      where: { uuid, direccion: 'S' },
    });
    if (!solicitud) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }
    if (solicitud.estado === estado) {
      return NextResponse.json({ recibida: true });
    }
    if (solicitud.estado !== 'pendiente') {
      return NextResponse.json({ error: 'La solicitud ya fue resuelta' }, { status: 409 });
    }

    await prisma.solicitudInterop.update({
      where: { id_solicitud: solicitud.id_solicitud },
      data: {
        estado,
        motivo_rechazo: motivoRechazo,
        ...(respuesta ? { respuesta } : {}),
        resuelta_at: new Date(),
      },
    });
    return NextResponse.json({ recibida: true });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Respuesta inválida' }, { status: 400 });
    }
    console.error('Error al recibir respuesta interop:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
