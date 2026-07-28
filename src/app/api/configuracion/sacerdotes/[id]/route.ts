import { NextRequest, NextResponse } from 'next/server';

import { PAGES } from '@/lib/pages';

import { withTenantScope, withTenantTransaction } from '@/lib/prisma-tenant';

import { logBitacoraCrud } from '@/lib/bitacora';

import { ForbiddenError } from '@/lib/errors';

import {

  assertCleroCatalogos,
  clearOtherParrocos,
  cleroCompoundId,
  cleroInclude,
  cleroPrismaWriteData,
  countCleroReferencias,
  serializeClero,
  validateCleroDeactivateInput,
  validateCleroUpdateInput,
} from '@/lib/sacerdote';

import {

  handleApiError,

  requireTenantWithAnyPermission,

  requireTenantWithPermission,

} from '@/lib/tenant';



export async function GET(

  _req: NextRequest,

  { params }: { params: Promise<{ id: string }> }

) {

  try {

    const { parishId } = await requireTenantWithAnyPermission([

      [PAGES.CONFIGURACION, 'ver'],

      [PAGES.PERSONAS, 'ver'],

      [PAGES.BAUTISMOS, 'ver'],

      [PAGES.PRIMERA_COMUNION, 'ver'],

      [PAGES.CONFIRMACIONES, 'ver'],

      [PAGES.MATRIMONIOS, 'ver'],

    ]);

    const { id: numeroIdentidad } = await params;



    const clero = await withTenantScope(parishId, (db) =>

      db.ordenSacerdotal.findFirst({

        where: {

          id_parroquia: parishId,

          numero_identidad: numeroIdentidad,

        },

        include: cleroInclude,

      })

    );



    if (!clero) {

      return NextResponse.json({ error: 'Registro clerical no encontrado' }, { status: 404 });

    }



    return NextResponse.json(serializeClero(clero));

  } catch (error) {

    return handleApiError(error);

  }

}



export async function PUT(

  req: NextRequest,

  { params }: { params: Promise<{ id: string }> }

) {

  try {

    const ctx = await requireTenantWithPermission(PAGES.CONFIGURACION, 'actualizar');

    const { id: numeroIdentidad } = await params;

    const body = await req.json();

    const validated = validateCleroUpdateInput(body, numeroIdentidad);



    if (!validated.ok) {

      return NextResponse.json({ error: validated.error }, { status: 400 });

    }



    const existing = await withTenantScope(ctx.parishId, (db) =>

      db.ordenSacerdotal.findFirst({

        where: {

          id_parroquia: ctx.parishId,

          numero_identidad: numeroIdentidad,

        },

      })

    );



    if (!existing) {

      throw new ForbiddenError();

    }



    const catalogError = await withTenantScope(ctx.parishId, (db) =>

      assertCleroCatalogos(db, validated.data)

    );

    if (catalogError) {

      return NextResponse.json({ error: catalogError }, { status: 400 });

    }



    const updated = await withTenantTransaction(ctx.parishId, async (tx) => {

      if (validated.data.es_parroco === 1) {

        await clearOtherParrocos(tx, ctx.parishId, numeroIdentidad);

      }



      const record = await tx.ordenSacerdotal.update({

        where: cleroCompoundId(ctx.parishId, numeroIdentidad),

        data: cleroPrismaWriteData(validated.data),

        include: cleroInclude,

      });



      await logBitacoraCrud(tx, {

        parishId: ctx.parishId,

        userId: ctx.userId,

        accion: 'U',

        nombreTabla: 'orden_sacerdotal',

        newValues: { numero_identidad: numeroIdentidad },

      });



      return record;

    });



    return NextResponse.json(serializeClero(updated));

  } catch (error) {

    return handleApiError(error);

  }

}



export async function PATCH(

  req: NextRequest,

  { params }: { params: Promise<{ id: string }> }

) {

  try {

    const ctx = await requireTenantWithPermission(PAGES.CONFIGURACION, 'actualizar');

    const { id: numeroIdentidad } = await params;

    const body = await req.json();

    const validated = validateCleroDeactivateInput(body);



    if (!validated.ok) {

      return NextResponse.json({ error: validated.error }, { status: 400 });

    }



    const existing = await withTenantScope(ctx.parishId, (db) =>

      db.ordenSacerdotal.findFirst({

        where: {

          id_parroquia: ctx.parishId,

          numero_identidad: numeroIdentidad,

        },

      })

    );



    if (!existing) {

      return NextResponse.json({ error: 'Registro clerical no encontrado' }, { status: 404 });

    }



    const updated = await withTenantTransaction(ctx.parishId, async (tx) => {

      const record = await tx.ordenSacerdotal.update({

        where: cleroCompoundId(ctx.parishId, numeroIdentidad),

        data: { estado_vital: validated.data.estado_ministerial },

        include: cleroInclude,

      });



      await logBitacoraCrud(tx, {

        parishId: ctx.parishId,

        userId: ctx.userId,

        accion: 'U',

        nombreTabla: 'orden_sacerdotal',

        newValues: {

          numero_identidad: numeroIdentidad,

          estado_ministerial: validated.data.estado_ministerial,

        },

      });



      return record;

    });



    return NextResponse.json(serializeClero(updated));

  } catch (error) {

    return handleApiError(error);

  }

}



export async function DELETE(

  _req: NextRequest,

  { params }: { params: Promise<{ id: string }> }

) {

  try {

    const ctx = await requireTenantWithPermission(PAGES.CONFIGURACION, 'borrar');

    const { id: numeroIdentidad } = await params;



    const existing = await withTenantScope(ctx.parishId, (db) =>

      db.ordenSacerdotal.findFirst({

        where: {

          id_parroquia: ctx.parishId,

          numero_identidad: numeroIdentidad,

        },

      })

    );



    if (!existing) {

      return NextResponse.json({ error: 'Registro clerical no encontrado' }, { status: 404 });

    }



    const referencias = await withTenantScope(ctx.parishId, (db) =>

      countCleroReferencias(db, ctx.parishId, numeroIdentidad)

    );



    if (referencias > 0) {

      const deactivated = await withTenantTransaction(ctx.parishId, async (tx) => {

        const record = await tx.ordenSacerdotal.update({

          where: cleroCompoundId(ctx.parishId, numeroIdentidad),

          data: { estado_vital: 0 },

          include: cleroInclude,

        });



        await logBitacoraCrud(tx, {

          parishId: ctx.parishId,

          userId: ctx.userId,

          accion: 'U',

          nombreTabla: 'orden_sacerdotal',

          newValues: { numero_identidad: numeroIdentidad, estado_ministerial: 0, estado_vital: 0 },

        });



        return record;

      });



      return NextResponse.json({

        success: true,

        deactivated: true,

        message:

          'El registro clerical fue desactivado. La persona permanece en el sistema.',

        clero: serializeClero(deactivated),

      });

    }



    await withTenantTransaction(ctx.parishId, async (tx) => {

      await tx.ordenSacerdotal.delete({

        where: cleroCompoundId(ctx.parishId, numeroIdentidad),

      });



      await logBitacoraCrud(tx, {

        parishId: ctx.parishId,

        userId: ctx.userId,

        accion: 'D',

        nombreTabla: 'orden_sacerdotal',

        oldValues: { numero_identidad: numeroIdentidad },

      });

    });



    return NextResponse.json({

      success: true,

      message: 'Registro clerical eliminado. La persona no fue afectada.',

    });

  } catch (error) {

    return handleApiError(error);

  }

}


