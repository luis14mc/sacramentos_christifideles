import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { contextoAuditoria, registrarBitacora } from '@/lib/bitacora';
import { jsonSafe } from '@/lib/serialize';

const MAX_NOMBRE = 55;
const MAX_CAPILLA = 55;
const MAX_DIRECCION = 1000;

async function getContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parishId) return null;
  const parishId = parseInt(session.user.parishId, 10);
  if (Number.isNaN(parishId)) return null;
  return { session, parishId };
}

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

function requiredString(v: unknown, max: number, label: string): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof v !== 'string' || v.trim().length === 0) {
    return { ok: false, error: `${label} es obligatorio` };
  }
  const trimmed = v.trim();
  if (trimmed.length > max) {
    return { ok: false, error: `${label} excede la longitud máxima (${max})` };
  }
  return { ok: true, value: trimmed };
}

function optionalString(v: unknown, max: number): { ok: true; value: string | null } | { ok: false; error: string } {
  if (v === null || v === undefined) return { ok: true, value: null };
  if (typeof v !== 'string') return { ok: false, error: 'Tipo de dato inválido' };
  const trimmed = v.trim();
  if (trimmed.length > max) return { ok: false, error: `Longitud máxima excedida (${max})` };
  return { ok: true, value: trimmed.length === 0 ? null : trimmed };
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canManageConfiguracion')) {
      return NextResponse.json({ error: 'No tienes permiso para modificar sectores' }, { status: 403 });
    }
    const { parishId, session } = context;

    const { id } = await ctx.params;
    let idBig: bigint;
    try {
      idBig = BigInt(id);
    } catch {
      return NextResponse.json({ error: 'Sector no encontrado' }, { status: 404 });
    }

    const previo = await prisma.sectorParroquial.findFirst({
      where: { id_sector_parroquial: idBig, id_parroquia: parishId },
    });
    if (!previo) return NextResponse.json({ error: 'Sector no encontrado' }, { status: 404 });

    const data = await req.json();
    const update: { nombre?: string; nombre_capilla?: string | null; direccion?: string } = {};

    if (data.nombre !== undefined) {
      const r = requiredString(data.nombre, MAX_NOMBRE, 'Nombre');
      if (!r.ok) return badRequest(r.error);
      update.nombre = r.value;
    }
    if (data.nombre_capilla !== undefined) {
      const r = optionalString(data.nombre_capilla, MAX_CAPILLA);
      if (!r.ok) return badRequest(r.error);
      update.nombre_capilla = r.value;
    }
    if (data.direccion !== undefined) {
      const r = requiredString(data.direccion, MAX_DIRECCION, 'Dirección');
      if (!r.ok) return badRequest(r.error);
      update.direccion = r.value;
    }

    const userId = BigInt(session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);

    const actualizado = await prisma.$transaction(async (tx) => {
      const { count } = await tx.sectorParroquial.updateMany({
        where: { id_sector_parroquial: idBig, id_parroquia: parishId },
        data: update,
      });
      if (count === 0) {
        throw new Error('FUERA_DE_ALCANCE');
      }
      const s = await tx.sectorParroquial.findUniqueOrThrow({ where: { id_sector_parroquial: idBig } });
      await registrarBitacora(tx, {
        parishId,
        userId,
        accion: 'U',
        nombreTabla: 'sector_parroquial',
        idAfectado: idBig,
        oldValues: jsonSafe(previo) as import('@prisma/client').Prisma.InputJsonValue,
        newValues: jsonSafe(update) as import('@prisma/client').Prisma.InputJsonValue,
        actorIp,
        userAgent,
      });
      return s;
    });

    return NextResponse.json(jsonSafe({
      ...actualizado,
      id_sector_parroquial: actualizado.id_sector_parroquial.toString(),
    }));
  } catch (error) {
    if (error instanceof Error && error.message === 'FUERA_DE_ALCANCE') {
      return NextResponse.json({ error: 'Sector no encontrado' }, { status: 404 });
    }
    console.error('Error al actualizar sector:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canManageConfiguracion')) {
      return NextResponse.json({ error: 'No tienes permiso para modificar sectores' }, { status: 403 });
    }
    const { parishId, session } = context;

    const { id } = await ctx.params;
    let idBig: bigint;
    try {
      idBig = BigInt(id);
    } catch {
      return NextResponse.json({ error: 'Sector no encontrado' }, { status: 404 });
    }

    const previo = await prisma.sectorParroquial.findFirst({
      where: { id_sector_parroquial: idBig, id_parroquia: parishId },
    });
    if (!previo) return NextResponse.json({ error: 'Sector no encontrado' }, { status: 404 });

    const personasAsociadas = await prisma.persona.count({
      where: { id_parroquia: parishId, id_sector_parroquial: idBig },
    });
    if (personasAsociadas > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar el sector porque tiene ${personasAsociadas} persona(s) asociada(s). Reasígnelas primero.`,
        },
        { status: 409 }
      );
    }

    const userId = BigInt(session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);

    await prisma.$transaction(async (tx) => {
      const { count } = await tx.sectorParroquial.deleteMany({
        where: { id_sector_parroquial: idBig, id_parroquia: parishId },
      });
      if (count === 0) {
        throw new Error('FUERA_DE_ALCANCE');
      }
      await registrarBitacora(tx, {
        parishId,
        userId,
        accion: 'D',
        nombreTabla: 'sector_parroquial',
        idAfectado: idBig,
        oldValues: jsonSafe(previo) as import('@prisma/client').Prisma.InputJsonValue,
        actorIp,
        userAgent,
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'FUERA_DE_ALCANCE') {
      return NextResponse.json({ error: 'Sector no encontrado' }, { status: 404 });
    }
    console.error('Error al eliminar sector:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}