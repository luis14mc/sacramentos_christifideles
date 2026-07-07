import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { prisma } from '@/lib/prisma';
import { logBitacoraCrud } from '@/lib/bitacora';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { safeParseBody } from '@/lib/validation';
import { rolParroquialCreateSchema } from '@/lib/validators/schemas';

export async function GET() {
  try {
    await requireTenantWithPermission(PAGES.CONFIGURACION, 'ver');

    const roles = await prisma.rolParroquial.findMany({
      include: { _count: { select: { miembros: true } } },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(roles);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.CONFIGURACION, 'crear');
    const body = await req.json();
    const validated = safeParseBody(rolParroquialCreateSchema, body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const nuevoRol = await prisma.$transaction(async (tx) => {
      const created = await tx.rolParroquial.create({
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
        nombreTabla: 'rol_parroquial',
        idTabla: BigInt(created.id_rol_parroquial),
        newValues: { nombre: validated.data.nombre },
      });

      return created;
    });

    return NextResponse.json(nuevoRol, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
