import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { contextoAuditoria, registrarBitacora } from '@/lib/bitacora';
import {
  CleroError,
  asegurarCatalogosClero,
  cleroDetailInclude,
  cleroWhereUnique,
  isEsParrocoValido,
  isEstadoMinisterialValido,
  parishIdFromSession,
  serializeClero,
} from '@/lib/clero';

function intOrNull(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
}

async function getContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parishId) return null;
  const parishId = parishIdFromSession(session);
  if (parishId === null) return null;
  return { session, parishId };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ dni: string }> }) {
  try {
    const context = await getContext();
    if (!context) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(context.session.user.rol, 'canViewSacerdotes')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { dni } = await params;
    const numeroIdentidad = decodeURIComponent(dni).trim();
    const row = await prisma.ordenSacerdotal.findUnique({
      where: cleroWhereUnique(context.parishId, numeroIdentidad),
      include: cleroDetailInclude,
    });
    if (!row) {
      return NextResponse.json({ error: 'Sacerdote no encontrado' }, { status: 404 });
    }
    return NextResponse.json(serializeClero(row));
  } catch (error) {
    console.error('Error al obtener sacerdote:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ dni: string }> }) {
  try {
    const context = await getContext();
    if (!context) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(context.session.user.rol, 'canManageSacerdotes')) {
      return NextResponse.json({ error: 'No tienes permiso para editar clero' }, { status: 403 });
    }

    const { dni } = await params;
    const numeroIdentidad = decodeURIComponent(dni).trim();
    const existente = await prisma.ordenSacerdotal.findUnique({
      where: cleroWhereUnique(context.parishId, numeroIdentidad),
      select: {
        numero_identidad: true,
        id_rango_sacerdotal: true,
        id_orden_religiosa: true,
        es_parroco: true,
        estado_ministerial: true,
        persona: { select: { estado_vital: true } },
      },
    });
    if (!existente) {
      return NextResponse.json({ error: 'Sacerdote no encontrado' }, { status: 404 });
    }

    const data = await req.json();
    const idRango = intOrNull(data.id_rango_sacerdotal) ?? existente.id_rango_sacerdotal;
    const idOrden = intOrNull(data.id_orden_religiosa) ?? existente.id_orden_religiosa;
    const esParroco = intOrNull(data.es_parroco) ?? existente.es_parroco;
    const estadoMinisterial = intOrNull(data.estado_ministerial) ?? existente.estado_ministerial;

    if (Number.isNaN(idRango) || Number.isNaN(idOrden)) {
      return NextResponse.json({ error: 'Catálogo clerical inválido' }, { status: 400 });
    }
    if (!isEsParrocoValido(esParroco)) {
      return NextResponse.json({ error: 'es_parroco debe ser 0 o 1' }, { status: 400 });
    }
    if (!isEstadoMinisterialValido(estadoMinisterial)) {
      return NextResponse.json({ error: 'estado_ministerial debe ser 0 o 1' }, { status: 400 });
    }
    if (estadoMinisterial === 1 && existente.persona.estado_vital !== 1) {
      return NextResponse.json(
        { error: 'No se puede activar el ministerio de una persona fallecida.' },
        { status: 400 }
      );
    }

    await asegurarCatalogosClero(idRango, idOrden);

    const userId = BigInt(context.session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);
    const oldValues = {
      numero_identidad: existente.numero_identidad,
      id_rango_sacerdotal: existente.id_rango_sacerdotal,
      id_orden_religiosa: existente.id_orden_religiosa,
      es_parroco: existente.es_parroco,
      estado_ministerial: existente.estado_ministerial,
    };
    const newValues = {
      numero_identidad: existente.numero_identidad,
      id_rango_sacerdotal: idRango,
      id_orden_religiosa: idOrden,
      es_parroco: esParroco,
      estado_ministerial: estadoMinisterial,
    };

    const actualizado = await prisma.$transaction(async (tx) => {
      const row = await tx.ordenSacerdotal.update({
        where: cleroWhereUnique(context.parishId, numeroIdentidad),
        data: {
          id_rango_sacerdotal: idRango,
          id_orden_religiosa: idOrden,
          es_parroco: esParroco,
          estado_ministerial: estadoMinisterial,
        },
        include: cleroDetailInclude,
      });
      await registrarBitacora(tx, {
        parishId: context.parishId,
        userId,
        accion: 'U',
        nombreTabla: 'orden_sacerdotal',
        oldValues,
        newValues,
        actorIp,
        userAgent,
      });
      return row;
    });

    return NextResponse.json(serializeClero(actualizado));
  } catch (error) {
    if (error instanceof CleroError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error al actualizar sacerdote:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
