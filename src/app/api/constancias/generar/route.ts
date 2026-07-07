import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope, withTenantTransaction } from '@/lib/prisma-tenant';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { logBitacoraCrud } from '@/lib/bitacora';
import {
  buildConstanciaHtml,
  CONSTANCIA_PRINT_STYLES,
} from '@/lib/constancias';
import { safeParseBody } from '@/lib/validation';
import { constanciaGenerarSchema } from '@/lib/validators/schemas';

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.CONSTANCIAS, 'crear');
    const body = await req.json();
    const validated = safeParseBody(constanciaGenerarSchema, body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { tipo, registroId } = validated.data;

    const { html, titulo } = await withTenantScope(ctx.parishId, (db) =>
      buildConstanciaHtml(db, ctx.parishId, { tipo, registroId })
    );

    await withTenantTransaction(ctx.parishId, (tx) =>
      logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'C',
        nombreTabla: 'constancia',
        newValues: { tipo, registroId, titulo },
      })
    );

    const documento = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${titulo}</title>
  <style>${CONSTANCIA_PRINT_STYLES}</style>
</head>
<body>${html}</body>
</html>`;

    return NextResponse.json({ titulo, html: documento });
  } catch (error) {
    if (error instanceof Error && error.message.includes('no encontrado')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return handleApiError(error);
  }
}
