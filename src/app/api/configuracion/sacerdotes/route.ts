import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope, withTenantTransaction } from '@/lib/prisma-tenant';
import { logBitacoraCrud } from '@/lib/bitacora';
import {
  handleApiError,
  requireTenantWithAnyPermission,
  requireTenantWithPermission,
} from '@/lib/tenant';
import { safeParseBody } from '@/lib/validation';
import { sacerdoteCreateSchema } from '@/lib/validators/schemas';

const sacerdoteInclude = {
  rango: { select: { nombre: true } },
  orden_religiosa: { select: { nombre: true } },
  parroquia: { select: { nombre: true } },
} as const;

export async function GET() {
  try {
    const { parishId } = await requireTenantWithAnyPermission([
      [PAGES.CONFIGURACION, 'ver'],
      [PAGES.PERSONAS, 'ver'],
      [PAGES.BAUTISMOS, 'ver'],
      [PAGES.PRIMERA_COMUNION, 'ver'],
      [PAGES.CONFIRMACIONES, 'ver'],
      [PAGES.MATRIMONIOS, 'ver'],
    ]);

    const sacerdotes = await withTenantScope(parishId, (db) =>
      db.ordenSacerdotal.findMany({
        where: { id_parroquia: parishId },
        include: sacerdoteInclude,
        orderBy: [
          { es_parroco: 'desc' },
          { apellidos: 'asc' },
          { nombres: 'asc' },
        ],
      })
    );

    return NextResponse.json(sacerdotes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.CONFIGURACION, 'crear');
    const body = await req.json();
    const validated = safeParseBody(sacerdoteCreateSchema, body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const data = validated.data;

    const nuevoSacerdote = await withTenantTransaction(ctx.parishId, async (tx) => {
      const created = await tx.ordenSacerdotal.create({
        data: {
          numero_identidad: data.numero_identidad,
          nombres: data.nombres,
          apellidos: data.apellidos,
          id_rango_sacerdotal: Number(data.id_rango_sacerdotal),
          id_parroquia: ctx.parishId,
          id_orden_religiosa: data.id_orden_religiosa
            ? Number(data.id_orden_religiosa)
            : 1,
          fecha_nacimiento: data.fecha_nacimiento
            ? new Date(data.fecha_nacimiento)
            : null,
          lugar_nacimiento: data.lugar_nacimiento,
          telefono: data.telefono,
          email: data.email || null,
          otra_orden_religiosa: data.otra_orden_religiosa,
          es_parroco: data.es_parroco ? Number(data.es_parroco) : 0,
          estado_vital: data.estado_vital ? Number(data.estado_vital) : 1,
          imagen: data.imagen,
        },
        include: {
          rango: { select: { nombre: true } },
          orden_religiosa: { select: { nombre: true } },
        },
      });

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'C',
        nombreTabla: 'orden_sacerdotal',
        newValues: { numero_identidad: data.numero_identidad },
      });

      return created;
    });

    return NextResponse.json(nuevoSacerdote, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
