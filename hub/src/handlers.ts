import { createHash } from 'node:crypto';
import { prisma } from './prisma';
import { autenticarInstancia, enviarAInstancia } from './instancias';
import {
  RUTAS_INSTANCIA,
  type InstanciaPublica,
  type SolicitudEntrante,
  type SolicitudRegistradaHub,
} from '../../src/lib/interop/contrato';

/**
 * Handlers del hub con Request/Response estándar (testeables sin servidor).
 * El hub solo registra y reenvía: no guarda motivo, DNI en claro ni respuestas.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function texto(valor: unknown, max: number): string | null {
  if (typeof valor !== 'string') return null;
  const v = valor.trim();
  return v && v.length <= max ? v : null;
}

function parse(cuerpo: string): Record<string, unknown> | null {
  try {
    const data = JSON.parse(cuerpo);
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

export async function health(): Promise<Response> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return json({ status: 'ok', database: 'ok' });
  } catch {
    return json({ status: 'degraded', database: 'unavailable' }, 503);
  }
}

/** GET /api/instancias: parroquias activas (para el selector de destino). */
export async function listarInstancias(req: Request): Promise<Response> {
  if (!(await autenticarInstancia(req, ''))) return json({ error: 'No autorizado' }, 401);
  const instancias = await prisma.instancia.findMany({
    where: { activa: true },
    select: { codigo: true, nombre: true },
    orderBy: { nombre: 'asc' },
  });
  return json(instancias satisfies InstanciaPublica[]);
}

/** POST /api/solicitudes: registra la consulta y la entrega a la parroquia destino. */
export async function crearSolicitud(req: Request): Promise<Response> {
  const cuerpo = await req.text();
  const origen = await autenticarInstancia(req, cuerpo);
  if (!origen) return json({ error: 'No autorizado' }, 401);

  const data = parse(cuerpo);
  const destinoCodigo = texto(data?.destino, 50);
  const numeroIdentidad = texto(data?.numero_identidad, 20);
  const motivo = texto(data?.motivo, 500);
  if (!destinoCodigo || !numeroIdentidad || !motivo) {
    return json({ error: 'Solicitud inválida' }, 400);
  }
  if (destinoCodigo === origen.codigo) return json({ error: 'Destino inválido' }, 400);

  const destino = await prisma.instancia.findUnique({ where: { codigo: destinoCodigo } });
  if (!destino?.activa) return json({ error: 'Parroquia destino no registrada' }, 404);

  const solicitud = await prisma.solicitud.create({
    data: {
      origen: origen.codigo,
      destino: destino.codigo,
      dni_hash: createHash('sha256').update(numeroIdentidad).digest('hex'),
    },
  });

  const entrante: SolicitudEntrante = {
    uuid: solicitud.uuid,
    origen: origen.codigo,
    origen_nombre: origen.nombre,
    numero_identidad: numeroIdentidad,
    motivo,
  };
  if (!(await enviarAInstancia(destino, RUTAS_INSTANCIA.entrantes, entrante))) {
    await prisma.solicitud.update({
      where: { uuid: solicitud.uuid },
      data: { estado: 'error_entrega' },
    });
    return json({ error: 'La parroquia destino no está disponible' }, 502);
  }

  const registrada: SolicitudRegistradaHub = { uuid: solicitud.uuid, destino_nombre: destino.nombre };
  return json(registrada, 201);
}

/** POST /api/solicitudes/:uuid/respuesta: la parroquia destino resuelve; se reenvía al origen. */
export async function responderSolicitud(req: Request, uuid: string): Promise<Response> {
  const cuerpo = await req.text();
  const emisor = await autenticarInstancia(req, cuerpo);
  if (!emisor) return json({ error: 'No autorizado' }, 401);
  if (!UUID_RE.test(uuid)) return json({ error: 'Solicitud no encontrada' }, 404);

  const solicitud = await prisma.solicitud.findUnique({
    where: { uuid },
    include: { instancia_origen: true },
  });
  // Solo la parroquia destino puede responder su propia solicitud.
  if (!solicitud || solicitud.destino !== emisor.codigo) {
    return json({ error: 'Solicitud no encontrada' }, 404);
  }
  if (solicitud.estado !== 'pendiente') return json({ error: 'La solicitud ya fue resuelta' }, 409);

  const data = parse(cuerpo);
  const estado = data?.estado;
  let resolucion: Record<string, unknown>;
  if (estado === 'aprobada' && data?.respuesta && typeof data.respuesta === 'object') {
    resolucion = { uuid, estado, respuesta: data.respuesta };
  } else if (estado === 'rechazada' && texto(data?.motivo_rechazo, 500)) {
    resolucion = { uuid, estado, motivo_rechazo: texto(data?.motivo_rechazo, 500) };
  } else {
    return json({ error: 'Respuesta inválida' }, 400);
  }

  if (!(await enviarAInstancia(solicitud.instancia_origen, RUTAS_INSTANCIA.respuestas, resolucion))) {
    // Queda pendiente: la parroquia destino puede reintentar.
    return json({ error: 'La parroquia solicitante no está disponible' }, 502);
  }

  await prisma.solicitud.update({
    where: { uuid },
    data: { estado: estado as string, resuelta_at: new Date() },
  });
  return json({ reenviada: true });
}
