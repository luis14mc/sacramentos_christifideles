import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { contextoAuditoria, registrarBitacora } from '@/lib/bitacora';
import { isPrismaUniqueError } from '@/lib/sacramentos';
import {
  CleroError,
  asegurarCatalogosClero,
  cleroInclude,
  cleroListWhere,
  cleroLiteSelect,
  isEsParrocoValido,
  isEstadoMinisterialValido,
  parishIdFromSession,
  resolverPersonaClerical,
  serializeClero,
  serializeCleroLite,
} from '@/lib/clero';

function intOrNull(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.parishId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const parishId = parishIdFromSession(session);
    if (parishId === null) {
      return NextResponse.json({ error: 'Parroquia de sesión inválida' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const lite = searchParams.get('lite') === '1';
    const canLite =
      hasPermission(session.user.rol, 'canViewSacramentos') ||
      hasPermission(session.user.rol, 'canViewSacerdotes');
    if (lite) {
      if (!canLite) {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
      }
    } else if (!hasPermission(session.user.rol, 'canViewSacerdotes')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const where = cleroListWhere({
      parishId,
      lite,
      q: searchParams.get('q') ?? undefined,
      dni: searchParams.get('dni') ?? undefined,
      nombre: searchParams.get('nombre') ?? undefined,
      apellido: searchParams.get('apellido') ?? undefined,
      rango: searchParams.get('rango') ?? undefined,
      estado: searchParams.get('estado') ?? undefined,
    });

    if (lite) {
      const items = await prisma.ordenSacerdotal.findMany({
        where,
        select: cleroLiteSelect,
        orderBy: [{ es_parroco: 'desc' }, { persona: { apellidos: 'asc' } }, { persona: { nombres: 'asc' } }],
        take: 200,
      });
      return NextResponse.json(items.map((row) => serializeCleroLite(row)));
    }

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const pageSize = 50;
    const [total, items] = await Promise.all([
      prisma.ordenSacerdotal.count({ where }),
      prisma.ordenSacerdotal.findMany({
        where,
        include: cleroInclude,
        orderBy: [{ es_parroco: 'desc' }, { persona: { apellidos: 'asc' } }, { persona: { nombres: 'asc' } }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      data: items.map((row) => serializeClero(row)),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error al listar sacerdotes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.parishId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(session.user.rol, 'canManageSacerdotes')) {
      return NextResponse.json({ error: 'No tienes permiso para registrar clero' }, { status: 403 });
    }
    const parishId = parishIdFromSession(session);
    if (parishId === null) {
      return NextResponse.json({ error: 'Parroquia de sesión inválida' }, { status: 400 });
    }

    const data = await req.json();
    const numeroIdentidad = typeof data.numero_identidad === 'string' ? data.numero_identidad.trim() : '';
    if (!numeroIdentidad) {
      return NextResponse.json({ error: 'El número de identidad es obligatorio' }, { status: 400 });
    }
    const idRango = intOrNull(data.id_rango_sacerdotal);
    const idOrden = intOrNull(data.id_orden_religiosa);
    if (idRango === null || Number.isNaN(idRango)) {
      return NextResponse.json({ error: 'Rango sacerdotal inválido.' }, { status: 400 });
    }
    if (idOrden === null || Number.isNaN(idOrden)) {
      return NextResponse.json({ error: 'Orden religiosa inválida.' }, { status: 400 });
    }
    const esParroco = intOrNull(data.es_parroco) ?? 0;
    const estadoMinisterial = intOrNull(data.estado_ministerial) ?? 1;
    if (!isEsParrocoValido(esParroco) || !isEstadoMinisterialValido(estadoMinisterial)) {
      return NextResponse.json({ error: 'es_parroco y estado_ministerial deben ser 0 o 1' }, { status: 400 });
    }

    await resolverPersonaClerical(parishId, numeroIdentidad);
    await asegurarCatalogosClero(idRango, idOrden);
    const userId = BigInt(session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);

    const creado = await prisma.$transaction(async (tx) => {
      const row = await tx.ordenSacerdotal.create({
        data: {
          id_parroquia: parishId,
          numero_identidad: numeroIdentidad,
          id_rango_sacerdotal: idRango,
          id_orden_religiosa: idOrden,
          es_parroco: esParroco,
          estado_ministerial: estadoMinisterial,
        },
        include: cleroInclude,
      });
      await registrarBitacora(tx, {
        parishId,
        userId,
        accion: 'C',
        nombreTabla: 'orden_sacerdotal',
        newValues: {
          numero_identidad: numeroIdentidad,
          id_rango_sacerdotal: idRango,
          id_orden_religiosa: idOrden,
          es_parroco: esParroco,
          estado_ministerial: estadoMinisterial,
        },
        actorIp,
        userAgent,
      });
      return row;
    });

    return NextResponse.json(serializeClero(creado), { status: 201 });
  } catch (error) {
    if (error instanceof CleroError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isPrismaUniqueError(error)) {
      return NextResponse.json(
        { error: 'Ya existe un registro clerical para esta persona en la parroquia' },
        { status: 409 }
      );
    }
    console.error('Error al crear sacerdote:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
