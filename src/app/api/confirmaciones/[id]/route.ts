import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope, withTenantTransaction } from '@/lib/prisma-tenant';
import { ForbiddenError } from '@/lib/errors';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { logBitacoraCrud } from '@/lib/bitacora';
import {
  CONFIRMACION_TABLE,
  assertConfirmacionReferencias,
  confirmacionInclude,
  serializeConfirmacion,
  validateConfirmacionInput,
} from '@/lib/confirmacion';

async function findRecord(parishId: number, id: string) {
  return withTenantScope(parishId, (db) =>
    db.confirmacion.findFirst({
      where: {
        id_parroquia: parishId,
        id_confirmacion: BigInt(id),
      },
      include: confirmacionInclude,
    })
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { parishId } = await requireTenantWithPermission(PAGES.CONFIRMACIONES, 'ver');
    const { id } = await params;

    const record = await findRecord(parishId, id);
    if (!record) {
      return NextResponse.json({ error: 'Confirmación no encontrada' }, { status: 404 });
    }

    return NextResponse.json(serializeConfirmacion(record));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.CONFIRMACIONES, 'actualizar');
    const { id } = await params;
    const body = await req.json();
    const validated = validateConfirmacionInput(body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const existing = await findRecord(ctx.parishId, id);
    if (!existing) {
      return NextResponse.json({ error: 'Confirmación no encontrada' }, { status: 404 });
    }

    const { data } = validated;

    const updated = await withTenantTransaction(ctx.parishId, async (tx) => {
      const refError = await assertConfirmacionReferencias(tx, ctx.parishId, data);
      if (refError) {
        throw new Error(refError);
      }

      await tx.confirmacion.updateMany({
        where: {
          id_parroquia: ctx.parishId,
          id_confirmacion: BigInt(id),
        },
        data: {
          numero_identidad_confirmado: data.numero_identidad_confirmado,
          numero_identidad_madre: data.numero_identidad_madre,
          numero_identidad_padre: data.numero_identidad_padre,
          numero_identidad_madrina: data.numero_identidad_madrina,
          numero_identidad_padrino: data.numero_identidad_padrino,
          numero_identidad_catequista: data.numero_identidad_catequista,
          numero_identidad_obispo: data.numero_identidad_obispo,
          fecha_confirmacion: new Date(data.fecha_confirmacion),
          nota_marginal: data.nota_marginal,
        },
      });

      const record = await tx.confirmacion.findFirst({
        where: {
          id_parroquia: ctx.parishId,
          id_confirmacion: BigInt(id),
        },
        include: confirmacionInclude,
      });

      if (!record) {
        throw new ForbiddenError();
      }

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'U',
        nombreTabla: CONFIRMACION_TABLE,
        idTabla: record.id_confirmacion,
        oldValues: serializeConfirmacion(existing) as object,
        newValues: serializeConfirmacion(record) as object,
      });

      return record;
    });

    return NextResponse.json(serializeConfirmacion(updated));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Persona no encontrada')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith('Obispo no encontrado')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.CONFIRMACIONES, 'borrar');
    const { id } = await params;

    const existing = await findRecord(ctx.parishId, id);
    if (!existing) {
      return NextResponse.json({ error: 'Confirmación no encontrada' }, { status: 404 });
    }

    await withTenantTransaction(ctx.parishId, async (tx) => {
      const result = await tx.confirmacion.deleteMany({
        where: {
          id_parroquia: ctx.parishId,
          id_confirmacion: BigInt(id),
        },
      });

      if (result.count === 0) {
        throw new ForbiddenError();
      }

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'D',
        nombreTabla: CONFIRMACION_TABLE,
        idTabla: existing.id_confirmacion,
        oldValues: serializeConfirmacion(existing) as object,
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
