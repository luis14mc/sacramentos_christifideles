import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope, withTenantTransaction } from '@/lib/prisma-tenant';
import { ForbiddenError } from '@/lib/errors';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { logBitacoraCrud } from '@/lib/bitacora';
import {
  PRIMERA_COMUNION_TABLE,
  assertPrimeraComunionReferencias,
  primeraComunionInclude,
  serializePrimeraComunion,
  validatePrimeraComunionInput,
} from '@/lib/primera-comunion';

async function findRecord(parishId: number, id: string) {
  return withTenantScope(parishId, (db) =>
    db.primeraComunion.findFirst({
      where: {
        id_parroquia: parishId,
        id_primera_comunion: BigInt(id),
      },
      include: primeraComunionInclude,
    })
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { parishId } = await requireTenantWithPermission(
      PAGES.PRIMERA_COMUNION,
      'ver'
    );
    const { id } = await params;

    const record = await findRecord(parishId, id);
    if (!record) {
      return NextResponse.json(
        { error: 'Registro de primera comunión no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(serializePrimeraComunion(record));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.PRIMERA_COMUNION, 'actualizar');
    const { id } = await params;
    const body = await req.json();
    const validated = validatePrimeraComunionInput(body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const existing = await findRecord(ctx.parishId, id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Registro de primera comunión no encontrado' },
        { status: 404 }
      );
    }

    const { data } = validated;

    const updated = await withTenantTransaction(ctx.parishId, async (tx) => {
      const refError = await assertPrimeraComunionReferencias(tx, ctx.parishId, data);
      if (refError) {
        throw new Error(refError);
      }

      await tx.primeraComunion.updateMany({
        where: {
          id_parroquia: ctx.parishId,
          id_primera_comunion: BigInt(id),
        },
        data: {
          numero_identidad_persona: data.numero_identidad_persona,
          numero_identidad_madre: data.numero_identidad_madre,
          numero_identidad_padre: data.numero_identidad_padre,
          numero_identidad_catequista: data.numero_identidad_catequista,
          numero_identidad_sacerdote: data.numero_identidad_sacerdote,
          fecha_primera_comunion: new Date(data.fecha_primera_comunion),
          nota_marginal: data.nota_marginal,
        },
      });

      const record = await tx.primeraComunion.findFirst({
        where: {
          id_parroquia: ctx.parishId,
          id_primera_comunion: BigInt(id),
        },
        include: primeraComunionInclude,
      });

      if (!record) {
        throw new ForbiddenError();
      }

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'U',
        nombreTabla: PRIMERA_COMUNION_TABLE,
        idTabla: record.id_primera_comunion,
        oldValues: serializePrimeraComunion(existing) as object,
        newValues: serializePrimeraComunion(record) as object,
      });

      return record;
    });

    return NextResponse.json(serializePrimeraComunion(updated));
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
    const ctx = await requireTenantWithPermission(PAGES.PRIMERA_COMUNION, 'borrar');
    const { id } = await params;

    const existing = await findRecord(ctx.parishId, id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Registro de primera comunión no encontrado' },
        { status: 404 }
      );
    }

    await withTenantTransaction(ctx.parishId, async (tx) => {
      const result = await tx.primeraComunion.deleteMany({
        where: {
          id_parroquia: ctx.parishId,
          id_primera_comunion: BigInt(id),
        },
      });

      if (result.count === 0) {
        throw new ForbiddenError();
      }

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'D',
        nombreTabla: PRIMERA_COMUNION_TABLE,
        idTabla: existing.id_primera_comunion,
        oldValues: serializePrimeraComunion(existing) as object,
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
