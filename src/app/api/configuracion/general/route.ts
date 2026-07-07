import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope, withTenantTransaction } from '@/lib/prisma-tenant';
import { logBitacoraCrud } from '@/lib/bitacora';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { safeParseBody } from '@/lib/validation';
import { configGeneralUpdateSchema } from '@/lib/validators/schemas';
import type { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const { parishId } = await requireTenantWithPermission(
      PAGES.CONFIGURACION,
      'ver'
    );

    const parroquia = await withTenantScope(parishId, (db) =>
      db.parroquia.findUnique({
        where: { id_parroquia: parishId },
        include: {
          config: true,
          municipio: { include: { departamento: true } },
        },
      })
    );

    if (!parroquia) {
      return NextResponse.json(
        { error: 'No se encontró configuración de parroquia' },
        { status: 404 }
      );
    }

    return NextResponse.json(parroquia);
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
    const validated = safeParseBody(configGeneralUpdateSchema, body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { parroquia: parroquiaData, configuracion: configData } = validated.data;

    if (
      parroquiaData?.id_parroquia &&
      Number(parroquiaData.id_parroquia) !== ctx.parishId
    ) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    await withTenantTransaction(ctx.parishId, async (tx) => {
      if (parroquiaData) {
        await tx.parroquia.update({
          where: { id_parroquia: ctx.parishId },
          data: {
            nombre: parroquiaData.nombre,
            direccion: parroquiaData.direccion,
            telefono: parroquiaData.telefono,
            email: parroquiaData.email || undefined,
            ubicacion: parroquiaData.ubicacion,
          },
        });
      }

      if (configData) {
        const opciones: Prisma.InputJsonValue =
          configData.opciones && typeof configData.opciones === 'object'
            ? (configData.opciones as Prisma.InputJsonValue)
            : {};

        await tx.parroquiaConfig.upsert({
          where: { id_parroquia: ctx.parishId },
          update: {
            alias_liturgico: configData.alias_liturgico,
            logo_url: configData.logo_url,
            sello_digital_url: configData.sello_digital_url,
            tz: configData.tz,
            idioma: configData.idioma,
            opciones,
          },
          create: {
            id_parroquia: ctx.parishId,
            alias_liturgico: configData.alias_liturgico,
            logo_url: configData.logo_url,
            sello_digital_url: configData.sello_digital_url,
            tz: configData.tz || 'America/Tegucigalpa',
            idioma: configData.idioma || 'es',
            opciones,
          },
        });
      }

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'U',
        nombreTabla: 'parroquia_config',
        newValues: { id_parroquia: ctx.parishId },
      });
    });

    const resultado = await withTenantScope(ctx.parishId, (db) =>
      db.parroquia.findUnique({
        where: { id_parroquia: ctx.parishId },
        include: {
          config: true,
          municipio: { include: { departamento: true } },
        },
      })
    );

    return NextResponse.json(resultado);
  } catch (error) {
    return handleApiError(error);
  }
}
