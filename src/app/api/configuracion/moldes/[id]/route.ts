import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { contextoAuditoria, registrarBitacora } from '@/lib/bitacora';
import { jsonSafe } from '@/lib/serialize';
import { esSacramentoConstancia } from '@/lib/constancias';
import { TOKENS_CONSTANCIA } from '@/lib/constancias';
import {
  listarCamposAcroForm,
  listarTiposAcroFormNoSoportados,
  obtenerMoldePorId,
  validarMapaCampos,
} from '@/lib/constancias/moldes';

async function getContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parishId) return null;
  const parishId = parseInt(session.user.parishId, 10);
  if (Number.isNaN(parishId)) return null;
  return { session, parishId };
}

function parseId(id: string): bigint | null {
  try {
    return BigInt(id);
  } catch {
    return null;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canViewConfiguracion')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    const { id: idStr } = await params;
    const id = parseId(idStr);
    if (id === null) return NextResponse.json({ error: 'Molde no encontrado' }, { status: 404 });
    const molde = await obtenerMoldePorId(context.parishId, id);
    if (!molde) return NextResponse.json({ error: 'Molde no encontrado' }, { status: 404 });
    return new NextResponse(Buffer.from(molde.archivo), {
      status: 200,
      headers: {
        'Content-Type': molde.archivo_mime || 'application/pdf',
        'Content-Disposition': `inline; filename="${molde.archivo_nombre}"`,
        'Cache-Control': 'private, max-age=0, no-store',
      },
    });
  } catch (error) {
    console.error('Error al descargar molde:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * PUT actualiza el molde:
 * - mapa_campos (opcional)
 * - nombre (opcional)
 * - activo (opcional; al activar exige mapa no vacío con campos reales)
 *
 * Multi-tenant: el WHERE compuesto garantiza que un molde de otra
 * parroquia nunca se toca.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canManageConfiguracion')) {
      return NextResponse.json({ error: 'No tienes permiso para editar moldes' }, { status: 403 });
    }
    const { id: idStr } = await params;
    const id = parseId(idStr);
    if (id === null) return NextResponse.json({ error: 'Molde no encontrado' }, { status: 404 });

    const existente = await prisma.moldeConstancia.findFirst({
      where: { id, id_parroquia: context.parishId },
    });
    if (!existente) return NextResponse.json({ error: 'Molde no encontrado' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const update: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    if (typeof body.nombre === 'string') {
      const trimmed = body.nombre.trim();
      if (!trimmed) return NextResponse.json({ error: 'Nombre vacío' }, { status: 400 });
      update.nombre = trimmed;
      newValues.nombre = trimmed;
    }

    let mapaNormalizado: Record<string, string> | undefined;
    if (body.mapa_campos !== undefined) {
      mapaNormalizado = body.mapa_campos as Record<string, string>;
    } else if (existente.mapa_campos && Object.keys(existente.mapa_campos as object).length > 0) {
      mapaNormalizado = existente.mapa_campos as Record<string, string>;
    }

    let nuevoActivo = existente.activo;
    if (typeof body.activo === 'boolean') nuevoActivo = body.activo;

    if (nuevoActivo) {
      if (!mapaNormalizado) {
        return NextResponse.json(
          { error: 'Para activar el molde debe incluir mapa_campos no vacío' },
          { status: 400 }
        );
      }
      const buf = new Uint8Array(existente.archivo);
      const tiposNoSoportados = await listarTiposAcroFormNoSoportados(buf);
      if (tiposNoSoportados.length > 0) {
        return NextResponse.json(
          {
            error:
              `El PDF contiene campos AcroForm no soportados: ${tiposNoSoportados.join(', ')}. ` +
              'Solo se admiten campos de texto, casillas de verificación y listas desplegables.',
          },
          { status: 400 }
        );
      }
      const camposPdf = new Set(await listarCamposAcroForm(buf));
      try {
        validarMapaCampos(mapaNormalizado, new Set<string>(TOKENS_CONSTANCIA), {
          requeridoMinimo: true,
          camposExistentes: camposPdf,
          coberturaCompleta: true,
        });
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 400 });
      }
      update.mapa_campos = mapaNormalizado;
      newValues.mapa_campos = mapaNormalizado;
    } else if (mapaNormalizado && Object.keys(mapaNormalizado).length > 0) {
      const camposPdf = new Set(await listarCamposAcroForm(new Uint8Array(existente.archivo)));
      try {
        validarMapaCampos(mapaNormalizado, new Set<string>(TOKENS_CONSTANCIA), {
          camposExistentes: camposPdf,
        });
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 400 });
      }
      update.mapa_campos = mapaNormalizado;
      newValues.mapa_campos = mapaNormalizado;
    }

    if (typeof body.activo === 'boolean' && body.activo !== existente.activo) {
      update.activo = body.activo;
      newValues.activo = body.activo;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Sin cambios' }, { status: 400 });
    }

    const userId = BigInt(context.session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);

    try {
      const actualizado = await prisma.$transaction(async (tx) => {
        const { count } = await tx.moldeConstancia.updateMany({
          where: { id, id_parroquia: context.parishId },
          data: update,
        });
        if (count === 0) throw new Error('MOLDE_FUERA_DE_ALCANCE');
        const m = await tx.moldeConstancia.findUniqueOrThrow({ where: { id } });
        await registrarBitacora(tx, {
          parishId: context.parishId,
          userId,
          accion: 'U',
          nombreTabla: 'molde_constancia',
          idAfectado: id,
          oldValues: { activo: existente.activo, mapa_campos: existente.mapa_campos as object },
          newValues: newValues as object,
          actorIp,
          userAgent,
        });
        return m;
      });
      return NextResponse.json(jsonSafe(actualizado));
    } catch (error) {
      if (isPrismaUniqueActivo(error)) {
        return NextResponse.json(
          { error: 'Ya existe otro molde activo para este sacramento y tipo en la parroquia' },
          { status: 409 }
        );
      }
      if (error instanceof Error && error.message === 'MOLDE_FUERA_DE_ALCANCE') {
        return NextResponse.json({ error: 'Molde no encontrado' }, { status: 404 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error al actualizar molde:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(req, { params });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canManageConfiguracion')) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar moldes' }, { status: 403 });
    }
    const { id: idStr } = await params;
    const id = parseId(idStr);
    if (id === null) return NextResponse.json({ error: 'Molde no encontrado' }, { status: 404 });

    const existente = await prisma.moldeConstancia.findFirst({
      where: { id, id_parroquia: context.parishId },
    });
    if (!existente) return NextResponse.json({ error: 'Molde no encontrado' }, { status: 404 });

    const userId = BigInt(context.session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);

    await prisma.$transaction(async (tx) => {
      const { count } = await tx.moldeConstancia.deleteMany({
        where: { id, id_parroquia: context.parishId },
      });
      if (count === 0) throw new Error('MOLDE_FUERA_DE_ALCANCE');
      await registrarBitacora(tx, {
        parishId: context.parishId,
        userId,
        accion: 'D',
        nombreTabla: 'molde_constancia',
        idAfectado: id,
        oldValues: {
          nombre: existente.nombre,
          sacramento: existente.sacramento,
          tipo_constancia: existente.tipo_constancia,
          activo: existente.activo,
        },
        actorIp,
        userAgent,
      });
    });

    return NextResponse.json({ message: 'Molde eliminado correctamente' });
  } catch (error) {
    if (error instanceof Error && error.message === 'MOLDE_FUERA_DE_ALCANCE') {
      return NextResponse.json({ error: 'Molde no encontrado' }, { status: 404 });
    }
    console.error('Error al eliminar molde:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

function isPrismaUniqueActivo(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; meta?: { constraint?: string; target?: string[] } };
  if (e.code !== 'P2002') return false;
  if (typeof e.meta?.constraint === 'string') {
    return e.meta.constraint.includes('molde_constancia_id_parroquia_sacramento_tipo_activo_key');
  }
  if (Array.isArray(e.meta?.target)) {
    const t = e.meta.target;
    return (
      t.includes('id_parroquia') &&
      t.includes('sacramento') &&
      t.includes('tipo_constancia') &&
      t.length === 3
    );
  }
  return false;
}
