import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope, withTenantTransaction } from '@/lib/prisma-tenant';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { logBitacoraCrud } from '@/lib/bitacora';
import {
  CONFIRMACION_TABLE,
  assertConfirmacionReferencias,
  confirmacionInclude,
  serializeConfirmacion,
  validateConfirmacionInput,
} from '@/lib/confirmacion';
import { reserveNextNumeracion } from '@/lib/numeradores';

export async function GET() {
  try {
    const { parishId } = await requireTenantWithPermission(PAGES.CONFIRMACIONES, 'ver');

    const registros = await withTenantScope(parishId, (db) =>
      db.confirmacion.findMany({
        where: { id_parroquia: parishId },
        include: confirmacionInclude,
        orderBy: [{ fecha_confirmacion: 'desc' }, { id_confirmacion: 'desc' }],
      })
    );

    return NextResponse.json(registros.map(serializeConfirmacion));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.CONFIRMACIONES, 'crear');
    const body = await req.json();
    const validated = validateConfirmacionInput(body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { data } = validated;

    const record = await withTenantTransaction(ctx.parishId, async (tx) => {
      const refError = await assertConfirmacionReferencias(tx, ctx.parishId, data);
      if (refError) {
        throw new Error(refError);
      }

      const numeracion = await reserveNextNumeracion(tx, ctx.parishId, 'confirmacion');

      const created = await tx.confirmacion.create({
        data: {
          id_parroquia: ctx.parishId,
          numero_identidad_confirmado: data.numero_identidad_confirmado,
          numero_identidad_madre: data.numero_identidad_madre,
          numero_identidad_padre: data.numero_identidad_padre,
          numero_identidad_madrina: data.numero_identidad_madrina,
          numero_identidad_padrino: data.numero_identidad_padrino,
          numero_identidad_catequista: data.numero_identidad_catequista,
          numero_identidad_obispo: data.numero_identidad_obispo,
          fecha_confirmacion: new Date(data.fecha_confirmacion),
          numero_libro: data.numero_libro ?? numeracion.numero_libro,
          numero_acta: data.numero_acta ?? numeracion.numero_acta!,
          numero_pagina: data.numero_pagina ?? numeracion.numero_pagina,
          numero_registro: data.numero_registro ?? numeracion.numero_registro,
          nota_marginal: data.nota_marginal,
        },
        include: confirmacionInclude,
      });

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'C',
        nombreTabla: CONFIRMACION_TABLE,
        idTabla: created.id_confirmacion,
        newValues: serializeConfirmacion(created) as object,
      });

      return created;
    });

    return NextResponse.json(serializeConfirmacion(record), { status: 201 });
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
