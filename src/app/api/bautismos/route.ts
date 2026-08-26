import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { jsonSafeSacramento as jsonSafe, ministroSelect } from '@/lib/sacramentos';
import { contextoAuditoria, registrarBitacora } from '@/lib/bitacora';
import { siguienteRegistro } from '@/lib/numeradores';
import {
  normalizeBautismoInput,
  validarReferenciasTenant,
  bautismoInclude,
  type BautismoInput,
} from '@/lib/bautismo';
import type { Prisma } from '@prisma/client';

async function getContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parishId) return null;
  const parishId = parseInt(session.user.parishId, 10);
  if (Number.isNaN(parishId)) return null;
  return { session, parishId };
}

export async function GET(req: NextRequest) {
  try {
    const context = await getContext();
    if (!context) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(context.session.user.rol, 'canViewSacramentos')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));

    // Todos los filtros permanecen dentro del tenant de sesión.
    const where: Prisma.BautismoWhereInput = { id_parroquia: context.parishId };
    const dni = searchParams.get('dni')?.trim();
    if (dni) where.numero_identidad_bautizado = dni;
    const libro = searchParams.get('libro')?.trim();
    if (libro) where.numero_libro = libro;
    const registro = searchParams.get('registro')?.trim();
    if (registro) where.numero_registro = registro;
    const nombre = searchParams.get('nombre')?.trim();
    if (nombre) {
      where.bautizado = {
        OR: [
          { nombres: { contains: nombre, mode: 'insensitive' } },
          { apellidos: { contains: nombre, mode: 'insensitive' } },
        ],
      };
    }
    const fecha = searchParams.get('fecha')?.trim();
    if (fecha) {
      const desde = new Date(fecha);
      if (!Number.isNaN(desde.getTime())) {
        const hasta = new Date(desde);
        hasta.setDate(hasta.getDate() + 1);
        where.fecha_bautismo = { gte: desde, lt: hasta };
      }
    }

    const [total, items] = await Promise.all([
      prisma.bautismo.count({ where }),
      prisma.bautismo.findMany({
        where,
        include: {
          bautizado: { select: { numero_identidad: true, nombres: true, apellidos: true } },
          sacerdote: { select: ministroSelect },
        },
        orderBy: [{ fecha_bautismo: 'desc' }, { numero_registro: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      data: jsonSafe(items),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error al listar bautismos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getContext();
    if (!context) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(context.session.user.rol, 'canCreateSacramentos')) {
      return NextResponse.json({ error: 'No tienes permiso para registrar bautismos' }, { status: 403 });
    }
    const { parishId } = context;

    const data = await req.json();
    // Numeración automática opcional: si el cliente la solicita, el número de
    // registro se reserva de forma atómica dentro de la transacción.
    const auto = data.numeracion_automatica === true;
    const parsed = normalizeBautismoInput(data);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const input: BautismoInput = parsed.input;

    // Todas las Personas y el sacerdote deben existir en la misma parroquia.
    const refError = await validarReferenciasTenant(parishId, input);
    if (refError) {
      return NextResponse.json({ error: refError }, { status: 400 });
    }

    // Unicidad registral: pre-check para UX (modo manual); el constraint es la
    // garantía final. En modo automático el número lo asigna el numerador.
    if (!auto) {
      const duplicado = await prisma.bautismo.findUnique({
        where: {
          id_parroquia_numero_libro_numero_pagina_numero_registro: {
            id_parroquia: parishId,
            numero_libro: input.numero_libro,
            numero_pagina: input.numero_pagina,
            numero_registro: input.numero_registro,
          },
        },
        select: { id_bautismo: true },
      });
      if (duplicado) {
        return NextResponse.json(
          { error: 'Ya existe un bautismo con este libro, página y número de registro en la parroquia.' },
          { status: 409 }
        );
      }
    }

    const userId = BigInt(context.session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);

    const creado = await prisma.$transaction(async (tx) => {
      const numeroRegistro = auto
        ? String(await siguienteRegistro({ tx, parishId, modulo: 'bautismo' }))
        : input.numero_registro;
      const bautismo = await tx.bautismo.create({
        data: { id_parroquia: parishId, ...input, numero_registro: numeroRegistro },
        include: bautismoInclude,
      });
      const newValues: Prisma.InputJsonValue = {
        ...input,
        numero_registro: numeroRegistro,
        fecha_bautismo: input.fecha_bautismo.toISOString(),
      };
      await registrarBitacora(tx, {
        parishId,
        userId,
        accion: 'C',
        nombreTabla: 'bautismo',
        idAfectado: bautismo.id_bautismo,
        newValues,
        actorIp,
        userAgent,
      });
      return bautismo;
    });

    return NextResponse.json(jsonSafe(creado), { status: 201 });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un bautismo con este libro, página y número de registro en la parroquia.' },
        { status: 409 }
      );
    }
    console.error('Error al crear bautismo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
