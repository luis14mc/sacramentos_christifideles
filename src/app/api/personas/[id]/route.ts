import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope, withTenantTransaction } from '@/lib/prisma-tenant';
import { logBitacoraCrud } from '@/lib/bitacora';
import { ForbiddenError } from '@/lib/errors';
import { assertPersonaSinCleroActivo } from '@/lib/sacerdote';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { safeParseBody } from '@/lib/validation';
import { personaUpdateSchema } from '@/lib/validators/schemas';

const personaInclude = {
  sector: { select: { nombre: true } },
  orden_religiosa: { select: { nombre: true } },
  municipio_nacimiento: {
    select: {
      nombre_municipio: true,
      departamento: { select: { nombre_departamento: true } },
    },
  },
} as const;

function serializePersona(persona: {
  id_sector_parroquial: bigint | null;
  id_orden_religiosa?: number | null;
  [key: string]: unknown;
}) {
  return {
    ...persona,
    id_sector_parroquial: persona.id_sector_parroquial?.toString(),
    id_orden_religiosa: persona.id_orden_religiosa?.toString(),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { parishId } = await requireTenantWithPermission(PAGES.PERSONAS, 'ver');
    const { id: numeroIdentidad } = await params;

    const persona = await withTenantScope(parishId, (db) =>
      db.persona.findFirst({
        where: { id_parroquia: parishId, numero_identidad: numeroIdentidad },
        include: personaInclude,
      })
    );

    if (!persona) {
      return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 });
    }

    return NextResponse.json(serializePersona(persona));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.PERSONAS, 'actualizar');
    const { id: numeroIdentidad } = await params;
    const body = await req.json();
    const validated = safeParseBody(personaUpdateSchema, body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const data = validated.data;

    const existing = await withTenantScope(ctx.parishId, (db) =>
      db.persona.findFirst({
        where: { id_parroquia: ctx.parishId, numero_identidad: numeroIdentidad },
      })
    );

    if (!existing) {
      throw new ForbiddenError();
    }

    await withTenantTransaction(ctx.parishId, async (tx) => {
      await tx.persona.updateMany({
        where: {
          id_parroquia: ctx.parishId,
          numero_identidad: numeroIdentidad,
        },
        data: {
          nombres: data.nombres,
          apellidos: data.apellidos,
          fecha_nacimiento: data.fecha_nacimiento
            ? new Date(data.fecha_nacimiento)
            : undefined,
          lugar_nacimiento: data.lugar_nacimiento ?? data.municipio_id,
          sexo:
            data.genero === 'Masculino' || data.sexo === 'M'
              ? 'M'
              : data.sexo === 'F'
                ? 'F'
                : data.sexo,
          telefono: data.telefono,
          email: data.email || null,
          direccion: data.direccion,
          id_sector_parroquial: data.id_sector_parroquial
            ? BigInt(String(data.id_sector_parroquial))
            : data.sector_id
              ? BigInt(String(data.sector_id))
              : undefined,
          id_orden_religiosa: data.id_orden_religiosa
            ? parseInt(String(data.id_orden_religiosa), 10)
            : undefined,
          estado_vital: data.estado_vital
            ? parseInt(String(data.estado_vital), 10)
            : undefined,
          estado_activo_parroquia: data.estado_activo_parroquia
            ? parseInt(String(data.estado_activo_parroquia), 10)
            : undefined,
          otra_orden_religiosa: data.otra_orden_religiosa,
          imagen: data.imagen,
        },
      });

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'U',
        nombreTabla: 'persona',
        newValues: { numero_identidad: numeroIdentidad },
      });
    });

    const persona = await withTenantScope(ctx.parishId, (db) =>
      db.persona.findFirst({
        where: { id_parroquia: ctx.parishId, numero_identidad: numeroIdentidad },
        include: personaInclude,
      })
    );

    return NextResponse.json(serializePersona(persona!));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.PERSONAS, 'borrar');
    const { id: numeroIdentidad } = await params;

    const cleroError = await withTenantScope(ctx.parishId, (db) =>
      assertPersonaSinCleroActivo(db, ctx.parishId, numeroIdentidad)
    );
    if (cleroError) {
      return NextResponse.json({ error: cleroError }, { status: 400 });
    }

    const result = await withTenantTransaction(ctx.parishId, async (tx) => {
      const deleted = await tx.persona.deleteMany({
        where: {
          id_parroquia: ctx.parishId,
          numero_identidad: numeroIdentidad,
        },
      });

      if (deleted.count === 0) {
        throw new ForbiddenError();
      }

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'D',
        nombreTabla: 'persona',
        oldValues: { numero_identidad: numeroIdentidad },
      });

      return deleted;
    });

    if (result.count === 0) {
      throw new ForbiddenError();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
