import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { jsonSafe } from '@/lib/serialize';
import { contextoAuditoria, registrarBitacora } from '@/lib/bitacora';
import { isPrismaUniqueError } from '@/lib/sacramentos';
import {
  normalizeComunionInput,
  validarReferenciasComunion,
  comunionInclude,
  type ComunionInput,
} from '@/lib/primera-comunion';
import type { Prisma } from '@prisma/client';

async function getContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parishId) return null;
  const parishId = parseInt(session.user.parishId, 10);
  if (Number.isNaN(parishId)) return null;
  return { session, parishId };
}

function parseId(idStr: string): bigint | null {
  try {
    return BigInt(idStr);
  } catch {
    return null;
  }
}

const DUPLICADO = 'Ya existe una primera comunión con este libro, página y número de registro en la parroquia.';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canViewSacramentos')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    const { id } = await params;
    const idComunion = parseId(id);
    if (idComunion === null) return NextResponse.json({ error: 'Primera comunión no encontrada' }, { status: 404 });

    const registro = await prisma.primeraComunion.findFirst({
      where: { id_primera_comunion: idComunion, id_parroquia: context.parishId },
      include: comunionInclude,
    });
    if (!registro) return NextResponse.json({ error: 'Primera comunión no encontrada' }, { status: 404 });

    return NextResponse.json(jsonSafe(registro));
  } catch (error) {
    console.error('Error al obtener primera comunión:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canEditSacramentos')) {
      return NextResponse.json({ error: 'No tienes permiso para editar primeras comuniones' }, { status: 403 });
    }
    const { parishId } = context;

    const { id } = await params;
    const idComunion = parseId(id);
    if (idComunion === null) return NextResponse.json({ error: 'Primera comunión no encontrada' }, { status: 404 });

    const existente = await prisma.primeraComunion.findFirst({
      where: { id_primera_comunion: idComunion, id_parroquia: parishId },
    });
    if (!existente) return NextResponse.json({ error: 'Primera comunión no encontrada' }, { status: 404 });

    const data = await req.json();
    if (data.id_parroquia !== undefined && parseInt(String(data.id_parroquia), 10) !== parishId) {
      return NextResponse.json({ error: 'No se permite cambiar la parroquia' }, { status: 400 });
    }

    const parsed = normalizeComunionInput(data);
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const input: ComunionInput = parsed.input;

    const refError = await validarReferenciasComunion(parishId, input);
    if (refError) return NextResponse.json({ error: refError }, { status: 400 });

    const colision = await prisma.primeraComunion.findFirst({
      where: {
        id_parroquia: parishId,
        numero_libro: input.numero_libro,
        numero_pagina: input.numero_pagina,
        numero_registro: input.numero_registro,
        NOT: { id_primera_comunion: idComunion },
      },
      select: { id_primera_comunion: true },
    });
    if (colision) return NextResponse.json({ error: DUPLICADO }, { status: 409 });

    const userId = BigInt(context.session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);
    const oldValues = jsonSafe(existente) as Prisma.InputJsonValue;
    const newValues: Prisma.InputJsonValue = { ...input, fecha_primera_comunion: input.fecha_primera_comunion.toISOString() };

    const actualizado = await prisma.$transaction(async (tx) => {
      const registro = await tx.primeraComunion.update({
        where: { id_primera_comunion: idComunion },
        data: { ...input },
        include: comunionInclude,
      });
      await registrarBitacora(tx, {
        parishId,
        userId,
        accion: 'U',
        nombreTabla: 'primera_comunion',
        idAfectado: idComunion,
        oldValues,
        newValues,
        actorIp,
        userAgent,
      });
      return registro;
    });

    return NextResponse.json(jsonSafe(actualizado));
  } catch (error) {
    if (isPrismaUniqueError(error)) return NextResponse.json({ error: DUPLICADO }, { status: 409 });
    console.error('Error al actualizar primera comunión:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE: no se expone borrado físico (historia sacramental). Ver Bautismo.
