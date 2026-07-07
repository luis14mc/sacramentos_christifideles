import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { prisma } from '@/lib/prisma';
import { logBitacoraCrud } from '@/lib/bitacora';
import { requireSuperAdmin } from '@/lib/rbac';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { safeParseBody } from '@/lib/validation';
import { permisoBulkPutSchema, permisoPostSchema } from '@/lib/validators/schemas';

function mapPermisosToFlags(permisos: {
  leer?: boolean;
  escribir?: boolean;
  eliminar?: boolean;
  administrar?: boolean;
}) {
  if (permisos.administrar) {
    return {
      puede_ver: 1,
      puede_crear: 1,
      puede_actualizar: 1,
      puede_borrar: 1,
    };
  }
  return {
    puede_ver: permisos.leer ? 1 : 0,
    puede_crear: permisos.escribir ? 1 : 0,
    puede_actualizar: permisos.escribir ? 1 : 0,
    puede_borrar: permisos.eliminar ? 1 : 0,
  };
}

export async function GET() {
  try {
    await requireTenantWithPermission(PAGES.CONFIGURACION, 'ver');

    const paginas = await prisma.pagina.findMany({
      include: {
        roles: {
          include: {
            rol: { select: { id_rol: true, nombre: true } },
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    const roles = await prisma.rolUsuario.findMany({
      where: { estado: 1 },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json({ permisos: paginas, roles });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireTenantWithPermission(
      PAGES.CONFIGURACION,
      'actualizar'
    );
    requireSuperAdmin(ctx.roleName);

    const body = await request.json();
    const validated = safeParseBody(permisoPostSchema, body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { id_rol, id_pagina, permisos } = validated.data;
    const flags = mapPermisosToFlags(permisos);

    await prisma.$transaction(async (tx) => {
      await tx.trRolPagina.upsert({
        where: {
          id_rol_id_pagina: {
            id_rol: Number(id_rol),
            id_pagina: Number(id_pagina),
          },
        },
        update: flags,
        create: {
          id_rol: Number(id_rol),
          id_pagina: Number(id_pagina),
          ...flags,
        },
      });

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'U',
        nombreTabla: 'tr_rol_pagina',
        newValues: { id_rol: Number(id_rol), id_pagina: Number(id_pagina) },
      });
    });

    return NextResponse.json({ message: 'Permisos actualizados exitosamente' });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ctx = await requireTenantWithPermission(
      PAGES.CONFIGURACION,
      'actualizar'
    );
    requireSuperAdmin(ctx.roleName);

    const body = await request.json();
    const validated = safeParseBody(permisoBulkPutSchema, body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { rol_id, permisos_bulk } = validated.data;

    await prisma.$transaction(async (tx) => {
      await tx.trRolPagina.deleteMany({
        where: { id_rol: Number(rol_id) },
      });

      const nuevosPermisos = [];
      for (const [id_pagina, acciones] of Object.entries(permisos_bulk)) {
        const flags = mapPermisosToFlags(acciones);
        nuevosPermisos.push({
          id_rol: Number(rol_id),
          id_pagina: parseInt(id_pagina, 10),
          ...flags,
        });
      }

      if (nuevosPermisos.length > 0) {
        await tx.trRolPagina.createMany({ data: nuevosPermisos });
      }

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'U',
        nombreTabla: 'tr_rol_pagina',
        newValues: { rol_id: Number(rol_id), count: nuevosPermisos.length },
      });
    });

    return NextResponse.json({ message: 'Permisos actualizados exitosamente' });
  } catch (error) {
    return handleApiError(error);
  }
}
