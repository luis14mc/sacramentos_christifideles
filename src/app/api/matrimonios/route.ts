import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope, withTenantTransaction } from '@/lib/prisma-tenant';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { logBitacoraCrud } from '@/lib/bitacora';
import {
  MATRIMONIO_TABLE,
  assertMatrimonioReferencias,
  matrimonioInclude,
  serializeMatrimonio,
  validateMatrimonioInput,
} from '@/lib/matrimonio';
import { reserveNextNumeracion } from '@/lib/numeradores';

export async function GET() {
  try {
    const { parishId } = await requireTenantWithPermission(PAGES.MATRIMONIOS, 'ver');

    const registros = await withTenantScope(parishId, (db) =>
      db.matrimonio.findMany({
        where: { id_parroquia: parishId },
        include: matrimonioInclude,
        orderBy: [{ fecha_matrimonio: 'desc' }, { id_matrimonio: 'desc' }],
      })
    );

    return NextResponse.json(registros.map(serializeMatrimonio));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.MATRIMONIOS, 'crear');
    const body = await req.json();
    const validated = validateMatrimonioInput(body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { data } = validated;

    const record = await withTenantTransaction(ctx.parishId, async (tx) => {
      const refError = await assertMatrimonioReferencias(tx, ctx.parishId, data);
      if (refError) {
        throw new Error(refError);
      }

      const numeracion = await reserveNextNumeracion(tx, ctx.parishId, 'matrimonio');

      const created = await tx.matrimonio.create({
        data: {
          id_parroquia: ctx.parishId,
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
          numero_libro: data.numero_libro ?? numeracion.numero_libro,
          numero_acta: data.numero_acta ?? numeracion.numero_acta!,
          numero_pagina: data.numero_pagina ?? numeracion.numero_pagina,
          numero_registro: data.numero_registro ?? numeracion.numero_registro,
          nota_marginal: data.nota_marginal,
        },
        include: matrimonioInclude,
      });

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'C',
        nombreTabla: MATRIMONIO_TABLE,
        idTabla: created.id_matrimonio,
        newValues: serializeMatrimonio(created) as object,
      });

      return created;
    });

    return NextResponse.json(serializeMatrimonio(record), { status: 201 });
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
