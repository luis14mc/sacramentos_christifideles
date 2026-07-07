import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope, withTenantTransaction } from '@/lib/prisma-tenant';
import { logBitacoraCrud } from '@/lib/bitacora';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { safeParseBody } from '@/lib/validation';
import { personaCreateSchema } from '@/lib/validators/schemas';

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
  id_sector_parroquial: bigint;
  [key: string]: unknown;
}) {
  return {
    ...persona,
    id_sector_parroquial: persona.id_sector_parroquial.toString(),
  };
}

export async function GET() {
  try {
    const { parishId } = await requireTenantWithPermission(PAGES.PERSONAS, 'ver');

    const personas = await withTenantScope(parishId, (db) =>
      db.persona.findMany({
        where: { id_parroquia: parishId },
        include: personaInclude,
        orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
      })
    );

    return NextResponse.json(personas.map(serializePersona));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { parishId, userId } = await requireTenantWithPermission(PAGES.PERSONAS, 'crear');
    const rawBody = await req.json();
    const validated = safeParseBody(personaCreateSchema, rawBody);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const data = rawBody as Record<string, unknown>;

    const sectorIdRaw =
      data.sector_id ??
      data.id_sector_parroquial ??
      validated.data.sector_id ??
      validated.data.id_sector_parroquial;

    if (
      sectorIdRaw === undefined ||
      sectorIdRaw === null ||
      sectorIdRaw === ''
    ) {
      return NextResponse.json(
        { error: 'El sector parroquial es obligatorio' },
        { status: 400 }
      );
    }

    const sectorId = String(sectorIdRaw);

    const sector = await withTenantScope(parishId, (db) =>
      db.sectorParroquial.findFirst({
        where: {
          id_sector_parroquial: BigInt(sectorId),
          id_parroquia: parishId,
        },
      })
    );

    if (!sector) {
      return NextResponse.json(
        { error: 'Sector no válido para esta parroquia' },
        { status: 400 }
      );
    }

    const nuevaPersona = await withTenantTransaction(parishId, async (tx) => {
      const created = await tx.persona.create({
        data: {
          numero_identidad: validated.data.numero_identidad,
          id_parroquia: parishId,
          id_sector_parroquial: BigInt(sectorId),
          id_orden_religiosa: validated.data.id_orden_religiosa
            ? parseInt(String(validated.data.id_orden_religiosa), 10)
            : data.id_orden_religiosa
              ? parseInt(String(data.id_orden_religiosa), 10)
              : 1,
          nombres: validated.data.nombres,
          apellidos: validated.data.apellidos,
          fecha_nacimiento: new Date(validated.data.fecha_nacimiento),
          lugar_nacimiento:
            validated.data.municipio_id ||
            validated.data.lugar_nacimiento ||
            String(data.municipio_id || data.lugar_nacimiento || '0801'),
          sexo:
            validated.data.genero === 'Masculino' || validated.data.sexo === 'M'
              ? 'M'
              : 'F',
          telefono: validated.data.telefono || String(data.telefono || ''),
          email: validated.data.email || null,
          direccion: validated.data.direccion || null,
          estado_vital: 1,
          estado_activo_parroquia: 1,
          otra_orden_religiosa: null,
          imagen: null,
        },
        include: personaInclude,
      });

      await logBitacoraCrud(tx, {
        parishId,
        userId,
        accion: 'C',
        nombreTabla: 'persona',
        newValues: { numero_identidad: validated.data.numero_identidad },
      });

      return created;
    });
    return NextResponse.json(serializePersona(nuevaPersona), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
