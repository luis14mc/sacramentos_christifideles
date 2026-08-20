import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { jsonSafe } from '@/lib/serialize';
import { contextoAuditoria, registrarBitacora } from '@/lib/bitacora';
import { isPrismaUniqueError } from '@/lib/sacramentos';
import {
  normalizeConfirmacionInput,
  validarReferenciasConfirmacion,
  confirmacionInclude,
  type ConfirmacionInput,
} from '@/lib/confirmacion';
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

const DUPLICADO = 'Ya existe una confirmación con este libro, página y número de registro en la parroquia.';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canViewSacramentos')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    const { id } = await params;
    const idConfirmacion = parseId(id);
    if (idConfirmacion === null) return NextResponse.json({ error: 'Confirmación no encontrada' }, { status: 404 });

    const registro = await prisma.confirmacion.findFirst({
      where: { id_confirmacion: idConfirmacion, id_parroquia: context.parishId },
      include: confirmacionInclude,
    });
    if (!registro) return NextResponse.json({ error: 'Confirmación no encontrada' }, { status: 404 });

    return NextResponse.json(jsonSafe(registro));
  } catch (error) {
    console.error('Error al obtener confirmación:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canEditSacramentos')) {
      return NextResponse.json({ error: 'No tienes permiso para editar confirmaciones' }, { status: 403 });
    }
    const { parishId } = context;

    const { id } = await params;
    const idConfirmacion = parseId(id);
    if (idConfirmacion === null) return NextResponse.json({ error: 'Confirmación no encontrada' }, { status: 404 });

    const existente = await prisma.confirmacion.findFirst({
      where: { id_confirmacion: idConfirmacion, id_parroquia: parishId },
    });
    if (!existente) return NextResponse.json({ error: 'Confirmación no encontrada' }, { status: 404 });

    const data = await req.json();
    if (data.id_parroquia !== undefined && parseInt(String(data.id_parroquia), 10) !== parishId) {
      return NextResponse.json({ error: 'No se permite cambiar la parroquia' }, { status: 400 });
    }

    const parsed = normalizeConfirmacionInput(data);
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const input: ConfirmacionInput = parsed.input;

    const refError = await validarReferenciasConfirmacion(parishId, input);
    if (refError) return NextResponse.json({ error: refError }, { status: 400 });

    const colision = await prisma.confirmacion.findFirst({
      where: {
        id_parroquia: parishId,
        numero_libro: input.numero_libro,
        numero_pagina: input.numero_pagina,
        numero_registro: input.numero_registro,
        NOT: { id_confirmacion: idConfirmacion },
      },
      select: { id_confirmacion: true },
    });
    if (colision) return NextResponse.json({ error: DUPLICADO }, { status: 409 });

    const userId = BigInt(context.session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);
    const oldValues = jsonSafe(existente) as Prisma.InputJsonValue;
    const newValues: Prisma.InputJsonValue = { ...input, fecha_confirmacion: input.fecha_confirmacion.toISOString() };

    const actualizado = await prisma.$transaction(async (tx) => {
      const registro = await tx.confirmacion.update({
        where: { id_confirmacion: idConfirmacion },
        data: { ...input },
        include: confirmacionInclude,
      });
      await registrarBitacora(tx, {
        parishId,
        userId,
        accion: 'U',
        nombreTabla: 'confirmacion',
        idAfectado: idConfirmacion,
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
    console.error('Error al actualizar confirmación:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE: no se expone borrado físico (historia sacramental). Ver Bautismo.
