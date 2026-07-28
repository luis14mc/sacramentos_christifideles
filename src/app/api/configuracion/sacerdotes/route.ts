import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope, withTenantTransaction } from '@/lib/prisma-tenant';
import { logBitacoraCrud } from '@/lib/bitacora';
import {
  assertCleroCatalogos,
  assertCleroNoDuplicado,
  assertPersonaExistsForClero,
  clearOtherParrocos,
  cleroActivoWhere,
  cleroInclude,
  cleroPrismaWriteData,
  filterCleroParaSacramento,
  serializeClero,
  validateCleroCreateInput,
} from '@/lib/sacerdote';
import {
  handleApiError,
  requireTenantWithAnyPermission,
  requireTenantWithPermission,
} from '@/lib/tenant';

export async function GET(req: NextRequest) {

  try {

    const { parishId } = await requireTenantWithAnyPermission([

      [PAGES.CONFIGURACION, 'ver'],

      [PAGES.PERSONAS, 'ver'],

      [PAGES.BAUTISMOS, 'ver'],

      [PAGES.PRIMERA_COMUNION, 'ver'],

      [PAGES.CONFIRMACIONES, 'ver'],

      [PAGES.MATRIMONIOS, 'ver'],

    ]);



    const { searchParams } = new URL(req.url);

    const tipoSacramento = searchParams.get('tipo');

    const soloActivos = searchParams.get('activos') === '1';



    const clero = await withTenantScope(parishId, (db) =>

      db.ordenSacerdotal.findMany({

        where: {

          id_parroquia: parishId,

          ...(soloActivos ? cleroActivoWhere : {}),

        },

        include: cleroInclude,

        orderBy: [

          { es_parroco: 'desc' },

          { persona: { apellidos: 'asc' } },

          { persona: { nombres: 'asc' } },

        ],

      })

    );



    let result = clero.map(serializeClero);



    if (tipoSacramento === 'obispo') {

      result = filterCleroParaSacramento(result, 'obispo');

    } else if (tipoSacramento === 'sacerdote') {

      result = filterCleroParaSacramento(result, 'sacerdote');

    }



    return NextResponse.json(result);

  } catch (error) {

    return handleApiError(error);

  }

}



export async function POST(req: NextRequest) {

  try {

    const ctx = await requireTenantWithPermission(PAGES.CONFIGURACION, 'crear');

    const body = await req.json();

    const validated = validateCleroCreateInput(body);



    if (!validated.ok) {

      return NextResponse.json({ error: validated.error }, { status: 400 });

    }



    const personaError = await withTenantScope(ctx.parishId, (db) =>

      assertPersonaExistsForClero(db, ctx.parishId, validated.data.numero_identidad)

    );

    if (personaError) {

      return NextResponse.json({ error: personaError }, { status: 400 });

    }



    const duplicateError = await withTenantScope(ctx.parishId, (db) =>

      assertCleroNoDuplicado(db, ctx.parishId, validated.data.numero_identidad)

    );

    if (duplicateError) {

      return NextResponse.json({ error: duplicateError }, { status: 409 });

    }



    const catalogError = await withTenantScope(ctx.parishId, (db) =>

      assertCleroCatalogos(db, validated.data)

    );

    if (catalogError) {

      return NextResponse.json({ error: catalogError }, { status: 400 });

    }



    const nuevoClero = await withTenantTransaction(ctx.parishId, async (tx) => {

      if (validated.data.es_parroco === 1) {

        await clearOtherParrocos(tx, ctx.parishId, validated.data.numero_identidad);

      }



      const created = await tx.ordenSacerdotal.create({
        data: {
          numero_identidad: validated.data.numero_identidad,
          id_parroquia: ctx.parishId,
          ...cleroPrismaWriteData(validated.data),
        },
        include: cleroInclude,
      });



      await logBitacoraCrud(tx, {

        parishId: ctx.parishId,

        userId: ctx.userId,

        accion: 'C',

        nombreTabla: 'orden_sacerdotal',

        newValues: { numero_identidad: validated.data.numero_identidad },

      });



      return created;

    });



    return NextResponse.json(serializeClero(nuevoClero), { status: 201 });

  } catch (error) {

    return handleApiError(error);

  }

}


