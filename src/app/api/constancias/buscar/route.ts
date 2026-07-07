import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope } from '@/lib/prisma-tenant';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { safeParseQuery } from '@/lib/validation';
import { constanciaBuscarSchema } from '@/lib/validators/schemas';
import { buscarSacramentosPorPersona } from '@/lib/constancias';

export async function GET(req: NextRequest) {
  try {
    const { parishId } = await requireTenantWithPermission(PAGES.CONSTANCIAS, 'ver');
    const validated = safeParseQuery(constanciaBuscarSchema, {
      identidad: req.nextUrl.searchParams.get('identidad'),
    });

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const resultado = await withTenantScope(parishId, (db) =>
      buscarSacramentosPorPersona(db, parishId, validated.data.identidad)
    );

    return NextResponse.json(resultado);
  } catch (error) {
    return handleApiError(error);
  }
}
