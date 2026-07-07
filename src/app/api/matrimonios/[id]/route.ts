import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope, withTenantTransaction } from '@/lib/prisma-tenant';
import { ForbiddenError } from '@/lib/errors';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { logBitacoraCrud } from '@/lib/bitacora';
import {
  MATRIMONIO_TABLE,
  assertMatrimonioReferencias,
  matrimonioInclude,
  serializeMatrimonio,
  validateMatrimonioInput,
} from '@/lib/matrimonio';

async function findRecord(parishId: number, id: string) {
  return withTenantScope(parishId, (db) =>
    db.matrimonio.findFirst({
      where: {
        id_parroquia: parishId,
        id_matrimonio: BigInt(id),
      },
      include: matrimonioInclude,
    })
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { parishId } = await requireTenantWithPermission(PAGES.MATRIMONIOS, 'ver');
    const { id } = await params;

    const record = await findRecord(parishId, id);
    if (!record) {
      return NextResponse.json({ error: 'Matrimonio no encontrado' }, { status: 404 });
    }

    return NextResponse.json(serializeMatrimonio(record));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.MATRIMONIOS, 'actualizar');
    const { id } = await params;
    const body = await req.json();
    const validated = validateMatrimonioInput(body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const existing = await findRecord(ctx.parishId, id);
    if (!existing) {
      return NextResponse.json({ error: 'Matrimonio no encontrado' }, { status: 404 });
    }

    const { data } = validated;

    const updated = await withTenantTransaction(ctx.parishId, async (tx) => {
      const refError = await assertMatrimonioReferencias(tx, ctx.parishId, data);
      if (refError) {
        throw new Error(refError);
      }

      await tx.matrimonio.updateMany({
        where: {
          id_parroquia: ctx.parishId,
          id_matrimonio: BigInt(id),
        },
        data: {
          numero_identidad_esposo: data.numero_identidad_esposo,
          numero_identidad_esposa: data.numero_identidad_esposa,
          numero_identidad_padrino: data.numero_identidad_padrino,
          numero_identidad_madrina: data.numero_identidad_madrina,
          numero_identidad_sacerdote: data.numero_identidad_sacerdote,
          numero_identidad_padre_esposo: data.numero_identidad_padre_esposo,
          numero_identidad_madre_esposo: data.numero_identidad_madre_esposo,
          numero_identidad_padre_esposa: data.numero_identidad_padre_esposa,
          numero_identidad_madre_esposa: data.numero_identidad_madre_esposa,
          fecha_matrimonio: new Date(data.fecha_matrimonio),
          nota_marginal: data.nota_marginal,
        },
      });

      const record = await tx.matrimonio.findFirst({
        where: {
          id_parroquia: ctx.parishId,
          id_matrimonio: BigInt(id),
        },
        include: matrimonioInclude,
      });

      if (!record) {
        throw new ForbiddenError();
      }

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'U',
        nombreTabla: MATRIMONIO_TABLE,
        idTabla: record.id_matrimonio,
        oldValues: serializeMatrimonio(existing) as object,
        newValues: serializeMatrimonio(record) as object,
      });

      return record;
    });

    return NextResponse.json(serializeMatrimonio(updated));
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
    const ctx = await requireTenantWithPermission(PAGES.MATRIMONIOS, 'borrar');
    const { id } = await params;

    const existing = await findRecord(ctx.parishId, id);
    if (!existing) {
      return NextResponse.json({ error: 'Matrimonio no encontrado' }, { status: 404 });
    }

    await withTenantTransaction(ctx.parishId, async (tx) => {
      const result = await tx.matrimonio.deleteMany({
        where: {
          id_parroquia: ctx.parishId,
          id_matrimonio: BigInt(id),
        },
      });

      if (result.count === 0) {
        throw new ForbiddenError();
      }

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'D',
        nombreTabla: MATRIMONIO_TABLE,
        idTabla: existing.id_matrimonio,
        oldValues: serializeMatrimonio(existing) as object,
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
