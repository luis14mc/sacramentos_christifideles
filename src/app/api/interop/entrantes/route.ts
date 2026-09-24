import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { leerConfigInterop, verificarPeticionHub } from '@/lib/interop/cliente';
import { MAX_DNI, MAX_MOTIVO, textoValido } from '@/lib/interop/solicitudes';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Recibe una consulta de otra parroquia (solo desde el hub, firmada).
 * Queda pendiente hasta que un usuario autorizado la apruebe o rechace.
 * Idempotente por uuid: reintentos del hub no duplican la solicitud.
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
    const uuid = typeof data?.uuid === 'string' && UUID_RE.test(data.uuid) ? data.uuid : null;
    const origen = textoValido(data?.origen, 50);
    const origenNombre = textoValido(data?.origen_nombre, 100);
    const numeroIdentidad = textoValido(data?.numero_identidad, MAX_DNI);
    const motivo = textoValido(data?.motivo, MAX_MOTIVO);
    if (!uuid || !origen || !numeroIdentidad || !motivo) {
      return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
    }

    // Una instancia = una parroquia (D1): la solicitud se asigna a la única parroquia de la BD.
    const parroquia = await prisma.parroquia.findFirst({
      select: { id_parroquia: true },
      orderBy: { id_parroquia: 'asc' },
    });
    if (!parroquia) {
      return NextResponse.json({ error: 'Instancia sin parroquia' }, { status: 503 });
    }

    await prisma.solicitudInterop.upsert({
      where: { uuid },
      update: {},
      create: {
        id_parroquia: parroquia.id_parroquia,
        uuid,
        direccion: 'E',
        codigo_parroquia_contraparte: origen,
        nombre_parroquia_contraparte: origenNombre,
        numero_identidad_consultado: numeroIdentidad,
        motivo,
      },
    });
    return NextResponse.json({ recibida: true }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
    }
    console.error('Error al recibir solicitud interop:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
