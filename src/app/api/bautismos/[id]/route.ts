import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { jsonSafeSacramento as jsonSafe } from '@/lib/sacramentos';
import { contextoAuditoria, registrarBitacora } from '@/lib/bitacora';
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

function parseId(idStr: string): bigint | null {
  try {
    return BigInt(idStr);
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await getContext();
    if (!context) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(context.session.user.rol, 'canViewSacramentos')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = await params;
    const idBautismo = parseId(id);
    if (idBautismo === null) {
      return NextResponse.json({ error: 'Bautismo no encontrado' }, { status: 404 });
    }

    // Búsqueda acotada al tenant: un bautismo de otra parroquia -> 404 (no 403).
    const bautismo = await prisma.bautismo.findFirst({
      where: { id_bautismo: idBautismo, id_parroquia: context.parishId },
      include: bautismoInclude,
    });
    if (!bautismo) {
      return NextResponse.json({ error: 'Bautismo no encontrado' }, { status: 404 });
    }

    return NextResponse.json(jsonSafe(bautismo));
  } catch (error) {
    console.error('Error al obtener bautismo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await getContext();
    if (!context) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(context.session.user.rol, 'canEditSacramentos')) {
      return NextResponse.json({ error: 'No tienes permiso para editar bautismos' }, { status: 403 });
    }
    const { parishId } = context;

    const { id } = await params;
    const idBautismo = parseId(id);
    if (idBautismo === null) {
      return NextResponse.json({ error: 'Bautismo no encontrado' }, { status: 404 });
    }

    // Debe existir dentro del tenant; si no, 404 (incluye cross-tenant).
    const existente = await prisma.bautismo.findFirst({
      where: { id_bautismo: idBautismo, id_parroquia: parishId },
    });
    if (!existente) {
      return NextResponse.json({ error: 'Bautismo no encontrado' }, { status: 404 });
    }

    const data = await req.json();

    // La parroquia nunca se cambia desde el cliente.
    if (data.id_parroquia !== undefined && parseInt(String(data.id_parroquia), 10) !== parishId) {
      return NextResponse.json({ error: 'No se permite cambiar la parroquia del bautismo' }, { status: 400 });
    }

    // PUT de reemplazo completo: revalidar todos los campos y referencias.
    const parsed = normalizeBautismoInput(data);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const input: BautismoInput = parsed.input;

    const refError = await validarReferenciasTenant(parishId, input);
    if (refError) {
      return NextResponse.json({ error: refError }, { status: 400 });
    }

    // Colisión de unicidad registral, excluyendo el propio registro.
    const colision = await prisma.bautismo.findFirst({
      where: {
        id_parroquia: parishId,
        numero_libro: input.numero_libro,
        numero_pagina: input.numero_pagina,
        numero_registro: input.numero_registro,
        NOT: { id_bautismo: idBautismo },
      },
      select: { id_bautismo: true },
    });
    if (colision) {
      return NextResponse.json(
        { error: 'Ya existe un bautismo con este libro, página y número de registro en la parroquia.' },
        { status: 409 }
      );
    }

    const userId = BigInt(context.session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);
    const oldValues = jsonSafe(existente) as Prisma.InputJsonValue;
    const newValues: Prisma.InputJsonValue = {
      ...input,
      fecha_bautismo: input.fecha_bautismo.toISOString(),
    };

    const actualizado = await prisma.$transaction(async (tx) => {
      const bautismo = await tx.bautismo.update({
        where: { id_bautismo: idBautismo },
        data: { ...input },
        include: bautismoInclude,
      });
      await registrarBitacora(tx, {
        parishId,
        userId,
        accion: 'U',
        nombreTabla: 'bautismo',
        idAfectado: idBautismo,
        oldValues,
        newValues,
        actorIp,
        userAgent,
      });
      return bautismo;
    });

    return NextResponse.json(jsonSafe(actualizado));
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un bautismo con este libro, página y número de registro en la parroquia.' },
        { status: 409 }
      );
    }
    console.error('Error al actualizar bautismo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE: no se expone borrado físico de Bautismo en v1 (decisión de dominio).
// La historia sacramental no se destruye; una futura anulación/estado se
// diseñará con su propia auditoría. Ver docs/DECISIONS y §10 del sprint.
