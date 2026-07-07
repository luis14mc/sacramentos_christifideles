import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope, withTenantTransaction } from '@/lib/prisma-tenant';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { logBitacoraCrud } from '@/lib/bitacora';
import {
  BAUTISMO_TABLE,
  assertBautismoReferencias,
  bautismoInclude,
  serializeBautismo,
  validateBautismoInput,
} from '@/lib/bautismo';
import { reserveNextNumeracion } from '@/lib/numeradores';

export async function GET() {
  try {
    const { parishId } = await requireTenantWithPermission(PAGES.BAUTISMOS, 'ver');

    const bautismos = await withTenantScope(parishId, (db) =>
      db.bautismo.findMany({
        where: { id_parroquia: parishId },
        include: bautismoInclude,
        orderBy: [{ fecha_bautismo: 'desc' }, { id_bautismo: 'desc' }],
      })
    );

    return NextResponse.json(bautismos.map(serializeBautismo));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.BAUTISMOS, 'crear');
    const body = await req.json();
    const validated = validateBautismoInput(body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { data } = validated;

    const bautismo = await withTenantTransaction(ctx.parishId, async (tx) => {
      const refError = await assertBautismoReferencias(tx, ctx.parishId, data);
      if (refError) {
        throw new Error(refError);
      }

      const numeracion = await reserveNextNumeracion(tx, ctx.parishId, 'bautismo');

      const created = await tx.bautismo.create({
        data: {
          id_parroquia: ctx.parishId,
          numero_identidad_bautizado: data.numero_identidad_bautizado,
          numero_identidad_madre: data.numero_identidad_madre,
          numero_identidad_padre: data.numero_identidad_padre,
          numero_identidad_madrina: data.numero_identidad_madrina,
          numero_identidad_padrino: data.numero_identidad_padrino,
          numero_identidad_catequista: data.numero_identidad_catequista,
          numero_identidad_sacerdote: data.numero_identidad_sacerdote,
          fecha_bautismo: new Date(data.fecha_bautismo),
          numero_libro: data.numero_libro ?? numeracion.numero_libro,
          numero_folio: data.numero_folio ?? numeracion.numero_folio,
          numero_pagina: data.numero_pagina ?? numeracion.numero_pagina,
          numero_registro: data.numero_registro ?? numeracion.numero_registro,
          nota_marginal: data.nota_marginal,
        },
        include: bautismoInclude,
      });

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'C',
        nombreTabla: BAUTISMO_TABLE,
        idTabla: created.id_bautismo,
        newValues: serializeBautismo(created) as object,
      });

      return created;
    });

    return NextResponse.json(serializeBautismo(bautismo), { status: 201 });
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
