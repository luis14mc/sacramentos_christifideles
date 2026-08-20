import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { jsonSafe } from '@/lib/serialize';
import { contextoAuditoria, registrarBitacora } from '@/lib/bitacora';
import { isPrismaUniqueError } from '@/lib/sacramentos';
import {
  normalizeMatrimonioInput,
  validarReferenciasMatrimonio,
  matrimonioInclude,
  type MatrimonioInput,
} from '@/lib/matrimonio';
import type { Prisma } from '@prisma/client';

async function getContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parishId) return null;
  const parishId = parseInt(session.user.parishId, 10);
  if (Number.isNaN(parishId)) return null;
  return { session, parishId };
}

const DUPLICADO = 'Ya existe un matrimonio con este libro, página y número de registro en la parroquia.';

export async function GET(req: NextRequest) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canViewSacramentos')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));

    const where: Prisma.MatrimonioWhereInput = { id_parroquia: context.parishId };
    const dni = searchParams.get('dni')?.trim();
    if (dni) {
      where.OR = [{ numero_identidad_esposa: dni }, { numero_identidad_esposo: dni }];
    }
    const libro = searchParams.get('libro')?.trim();
    if (libro) where.numero_libro = libro;
    const registro = searchParams.get('registro')?.trim();
    if (registro) where.numero_registro = registro;
    const nombre = searchParams.get('nombre')?.trim();
    if (nombre) {
      const filtro = {
        OR: [
          { nombres: { contains: nombre, mode: 'insensitive' as const } },
          { apellidos: { contains: nombre, mode: 'insensitive' as const } },
        ],
      };
      where.OR = [{ esposa: filtro }, { esposo: filtro }];
    }
    const fecha = searchParams.get('fecha')?.trim();
    if (fecha) {
      const desde = new Date(fecha);
      if (!Number.isNaN(desde.getTime())) {
        const hasta = new Date(desde);
        hasta.setDate(hasta.getDate() + 1);
        where.fecha_matrimonio = { gte: desde, lt: hasta };
      }
    }

    const [total, items] = await Promise.all([
      prisma.matrimonio.count({ where }),
      prisma.matrimonio.findMany({
        where,
        include: {
          esposa: { select: { numero_identidad: true, nombres: true, apellidos: true } },
          esposo: { select: { numero_identidad: true, nombres: true, apellidos: true } },
          sacerdote: { select: { numero_identidad: true, nombres: true, apellidos: true } },
        },
        orderBy: [{ fecha_matrimonio: 'desc' }, { numero_registro: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({ data: jsonSafe(items), page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('Error al listar matrimonios:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canCreateSacramentos')) {
      return NextResponse.json({ error: 'No tienes permiso para registrar matrimonios' }, { status: 403 });
    }
    const { parishId } = context;

    const data = await req.json();
    const parsed = normalizeMatrimonioInput(data);
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const input: MatrimonioInput = parsed.input;

    const refError = await validarReferenciasMatrimonio(parishId, input);
    if (refError) return NextResponse.json({ error: refError }, { status: 400 });

    const duplicado = await prisma.matrimonio.findFirst({
      where: {
        id_parroquia: parishId,
        numero_libro: input.numero_libro,
        numero_pagina: input.numero_pagina,
        numero_registro: input.numero_registro,
      },
      select: { id_matrimonio: true },
    });
    if (duplicado) return NextResponse.json({ error: DUPLICADO }, { status: 409 });

    const userId = BigInt(context.session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);
    const newValues: Prisma.InputJsonValue = { ...input, fecha_matrimonio: input.fecha_matrimonio.toISOString() };

    const creado = await prisma.$transaction(async (tx) => {
      const registro = await tx.matrimonio.create({
        data: { id_parroquia: parishId, ...input },
        include: matrimonioInclude,
      });
      await registrarBitacora(tx, {
        parishId,
        userId,
        accion: 'C',
        nombreTabla: 'matrimonio',
        idAfectado: registro.id_matrimonio,
        newValues,
        actorIp,
        userAgent,
      });
      return registro;
    });

    return NextResponse.json(jsonSafe(creado), { status: 201 });
  } catch (error) {
    if (isPrismaUniqueError(error)) return NextResponse.json({ error: DUPLICADO }, { status: 409 });
    console.error('Error al crear matrimonio:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
