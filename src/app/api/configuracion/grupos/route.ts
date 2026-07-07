import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { prisma } from '@/lib/prisma';
import { logBitacoraCrud } from '@/lib/bitacora';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { safeParseBody } from '@/lib/validation';
import { grupoCreateSchema } from '@/lib/validators/schemas';

export async function GET() {
  try {
    await requireTenantWithPermission(PAGES.CONFIGURACION, 'ver');

    const grupos = await prisma.grupoParroquial.findMany({
      include: { _count: { select: { miembros: true } } },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(grupos);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.CONFIGURACION, 'crear');
    const body = await req.json();
    const validated = safeParseBody(grupoCreateSchema, body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const nuevoGrupo = await prisma.$transaction(async (tx) => {
      const created = await tx.grupoParroquial.create({
        data: {
          nombre: validated.data.nombre,
          descripcion: validated.data.descripcion,
        },
        include: { _count: { select: { miembros: true } } },
      });

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'C',
        nombreTabla: 'grupo_parroquial',
        idTabla: BigInt(created.id_grupo_parroquial),
        newValues: { nombre: validated.data.nombre },
      });

      return created;
    });

    return NextResponse.json(nuevoGrupo, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
