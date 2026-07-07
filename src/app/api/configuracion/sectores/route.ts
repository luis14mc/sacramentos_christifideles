import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope, withTenantTransaction } from '@/lib/prisma-tenant';
import { logBitacoraCrud } from '@/lib/bitacora';
import { ForbiddenError } from '@/lib/errors';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { safeParseBody } from '@/lib/validation';
import { sectorCreateSchema, sectorUpdateSchema } from '@/lib/validators/schemas';

function mapSectorResponse(sector: {
  id_sector_parroquial: bigint;
  id_parroquia: number;
  id_tipo_sector_parroquial: number;
  nombre: string;
  nombre_capilla: string | null;
  direccion: string;
  parroquia: { nombre: string };
  tipo_sector: { nombre: string; descripcion: string | null };
  _count: { personas: number };
}) {
  return {
    ...sector,
    id_sector_parroquial: Number(sector.id_sector_parroquial),
    tipoSector: sector.tipo_sector,
    _count: { miembros: sector._count.personas },
  };
}

const sectorInclude = {
  parroquia: { select: { nombre: true } },
  tipo_sector: { select: { nombre: true, descripcion: true } },
  _count: { select: { personas: true } },
} as const;

export async function GET() {
  try {
    const { parishId } = await requireTenantWithPermission(
      PAGES.CONFIGURACION,
      'ver'
    );

    const sectores = await withTenantScope(parishId, (db) =>
      db.sectorParroquial.findMany({
        where: { id_parroquia: parishId },
        include: sectorInclude,
        orderBy: { nombre: 'asc' },
      })
    );

    return NextResponse.json(sectores.map(mapSectorResponse));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.CONFIGURACION, 'crear');
    const body = await request.json();
    const validated = safeParseBody(sectorCreateSchema, body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { id_tipo_sector_parroquial, nombre, nombre_capilla, direccion } =
      validated.data;

    const nuevoSector = await withTenantTransaction(ctx.parishId, async (tx) => {
      const created = await tx.sectorParroquial.create({
        data: {
          id_parroquia: ctx.parishId,
          id_tipo_sector_parroquial: Number(id_tipo_sector_parroquial),
          nombre,
          nombre_capilla,
          direccion: direccion || '',
        },
        include: sectorInclude,
      });

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'C',
        nombreTabla: 'sector_parroquial',
        idTabla: created.id_sector_parroquial,
        newValues: { nombre },
      });

      return created;
    });

    return NextResponse.json(mapSectorResponse(nuevoSector), { status: 201 });
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
    const body = await request.json();
    const validated = safeParseBody(sectorUpdateSchema, body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const {
      id_sector_parroquial,
      id_tipo_sector_parroquial,
      nombre,
      nombre_capilla,
      direccion,
    } = validated.data;

    const sectorId = parseInt(String(id_sector_parroquial), 10);

    await withTenantTransaction(ctx.parishId, async (tx) => {
      const result = await tx.sectorParroquial.updateMany({
        where: {
          id_sector_parroquial: BigInt(sectorId),
          id_parroquia: ctx.parishId,
        },
        data: {
          id_tipo_sector_parroquial: Number(id_tipo_sector_parroquial),
          nombre,
          nombre_capilla,
          direccion,
        },
      });

      if (result.count === 0) {
        throw new ForbiddenError();
      }

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'U',
        nombreTabla: 'sector_parroquial',
        idTabla: BigInt(sectorId),
        newValues: { nombre },
      });
    });

    const sectorActualizado = await withTenantScope(ctx.parishId, (db) =>
      db.sectorParroquial.findFirst({
        where: {
          id_sector_parroquial: BigInt(sectorId),
          id_parroquia: ctx.parishId,
        },
        include: sectorInclude,
      })
    );

    return NextResponse.json(mapSectorResponse(sectorActualizado!));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.CONFIGURACION, 'borrar');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID del sector es requerido' },
        { status: 400 }
      );
    }

    const sector = await withTenantScope(ctx.parishId, (db) =>
      db.sectorParroquial.findFirst({
        where: {
          id_sector_parroquial: BigInt(parseInt(id, 10)),
          id_parroquia: ctx.parishId,
        },
        include: { _count: { select: { personas: true } } },
      })
    );

    if (!sector) {
      return NextResponse.json({ error: 'Sector no encontrado' }, { status: 404 });
    }

    if (sector._count.personas > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un sector que tiene miembros asociados' },
        { status: 400 }
      );
    }

    await withTenantTransaction(ctx.parishId, async (tx) => {
      await tx.sectorParroquial.delete({
        where: { id_sector_parroquial: BigInt(parseInt(id, 10)) },
      });

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'D',
        nombreTabla: 'sector_parroquial',
        idTabla: BigInt(parseInt(id, 10)),
      });
    });

    return NextResponse.json({ message: 'Sector eliminado exitosamente' });
  } catch (error) {
    return handleApiError(error);
  }
}
