import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope, withTenantTransaction } from '@/lib/prisma-tenant';
import { ForbiddenError } from '@/lib/errors';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { logBitacoraCrud } from '@/lib/bitacora';
import {
  BAUTISMO_TABLE,
  assertBautismoReferencias,
  bautismoInclude,
  serializeBautismo,
  validateBautismoInput,
} from '@/lib/bautismo';

async function findBautismo(parishId: number, id: string) {
  return withTenantScope(parishId, (db) =>
    db.bautismo.findFirst({
      where: {
        id_parroquia: parishId,
        id_bautismo: BigInt(id),
      },
      include: bautismoInclude,
    })
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { parishId } = await requireTenantWithPermission(PAGES.BAUTISMOS, 'ver');
    const { id } = await params;

    const bautismo = await findBautismo(parishId, id);
    if (!bautismo) {
      return NextResponse.json({ error: 'Bautismo no encontrado' }, { status: 404 });
    }

    return NextResponse.json(serializeBautismo(bautismo));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.BAUTISMOS, 'actualizar');
    const { id } = await params;
    const body = await req.json();
    const validated = validateBautismoInput(body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const existing = await findBautismo(ctx.parishId, id);
    if (!existing) {
      return NextResponse.json({ error: 'Bautismo no encontrado' }, { status: 404 });
    }

    const { data } = validated;

    const updated = await withTenantTransaction(ctx.parishId, async (tx) => {
      const refError = await assertBautismoReferencias(tx, ctx.parishId, data);
      if (refError) {
        throw new Error(refError);
      }

      await tx.bautismo.updateMany({
        where: {
          id_parroquia: ctx.parishId,
          id_bautismo: BigInt(id),
        },
        data: {
          numero_identidad_bautizado: data.numero_identidad_bautizado,
          numero_identidad_madre: data.numero_identidad_madre,
          numero_identidad_padre: data.numero_identidad_padre,
          numero_identidad_madrina: data.numero_identidad_madrina,
          numero_identidad_padrino: data.numero_identidad_padrino,
          numero_identidad_catequista: data.numero_identidad_catequista,
          numero_identidad_sacerdote: data.numero_identidad_sacerdote,
          fecha_bautismo: new Date(data.fecha_bautismo),
          nota_marginal: data.nota_marginal,
        },
      });

      const record = await tx.bautismo.findFirst({
        where: {
          id_parroquia: ctx.parishId,
          id_bautismo: BigInt(id),
        },
        include: bautismoInclude,
      });

      if (!record) {
        throw new ForbiddenError();
      }

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'U',
        nombreTabla: BAUTISMO_TABLE,
        idTabla: record.id_bautismo,
        oldValues: serializeBautismo(existing) as object,
        newValues: serializeBautismo(record) as object,
      });

      return record;
    });

    return NextResponse.json(serializeBautismo(updated));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Persona no encontrada')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith('Sacerdote no encontrado')) {
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
    const ctx = await requireTenantWithPermission(PAGES.BAUTISMOS, 'borrar');
    const { id } = await params;

    const existing = await findBautismo(ctx.parishId, id);
    if (!existing) {
      return NextResponse.json({ error: 'Bautismo no encontrado' }, { status: 404 });
    }

    await withTenantTransaction(ctx.parishId, async (tx) => {
      const result = await tx.bautismo.deleteMany({
        where: {
          id_parroquia: ctx.parishId,
          id_bautismo: BigInt(id),
        },
      });

      if (result.count === 0) {
        throw new ForbiddenError();
      }

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'D',
        nombreTabla: BAUTISMO_TABLE,
        idTabla: existing.id_bautismo,
        oldValues: serializeBautismo(existing) as object,
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
