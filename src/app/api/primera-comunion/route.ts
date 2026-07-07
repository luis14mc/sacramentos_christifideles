import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope, withTenantTransaction } from '@/lib/prisma-tenant';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { logBitacoraCrud } from '@/lib/bitacora';
import {
  PRIMERA_COMUNION_TABLE,
  assertPrimeraComunionReferencias,
  primeraComunionInclude,
  serializePrimeraComunion,
  validatePrimeraComunionInput,
} from '@/lib/primera-comunion';
import { reserveNextNumeracion } from '@/lib/numeradores';

export async function GET() {
  try {
    const { parishId } = await requireTenantWithPermission(
      PAGES.PRIMERA_COMUNION,
      'ver'
    );

    const registros = await withTenantScope(parishId, (db) =>
      db.primeraComunion.findMany({
        where: { id_parroquia: parishId },
        include: primeraComunionInclude,
        orderBy: [{ fecha_primera_comunion: 'desc' }, { id_primera_comunion: 'desc' }],
      })
    );

    return NextResponse.json(registros.map(serializePrimeraComunion));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.PRIMERA_COMUNION, 'crear');
    const body = await req.json();
    const validated = validatePrimeraComunionInput(body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { data } = validated;

    const record = await withTenantTransaction(ctx.parishId, async (tx) => {
      const refError = await assertPrimeraComunionReferencias(tx, ctx.parishId, data);
      if (refError) {
        throw new Error(refError);
      }

      const numeracion = await reserveNextNumeracion(
        tx,
        ctx.parishId,
        'primera_comunion'
      );

      const created = await tx.primeraComunion.create({
        data: {
          id_parroquia: ctx.parishId,
          numero_identidad_persona: data.numero_identidad_persona,
          numero_identidad_madre: data.numero_identidad_madre,
          numero_identidad_padre: data.numero_identidad_padre,
          numero_identidad_catequista: data.numero_identidad_catequista,
          numero_identidad_sacerdote: data.numero_identidad_sacerdote,
          fecha_primera_comunion: new Date(data.fecha_primera_comunion),
          numero_libro: data.numero_libro ?? numeracion.numero_libro,
          numero_acta: data.numero_acta ?? numeracion.numero_acta!,
          numero_pagina: data.numero_pagina ?? numeracion.numero_pagina,
          numero_registro: data.numero_registro ?? numeracion.numero_registro,
          nota_marginal: data.nota_marginal,
        },
        include: primeraComunionInclude,
      });

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'C',
        nombreTabla: PRIMERA_COMUNION_TABLE,
        idTabla: created.id_primera_comunion,
        newValues: serializePrimeraComunion(created) as object,
      });

      return created;
    });

    return NextResponse.json(serializePrimeraComunion(record), { status: 201 });
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
