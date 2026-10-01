import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { contextoAuditoria, registrarBitacora } from '@/lib/bitacora';
import { jsonSafe } from '@/lib/serialize';

const MAX_NOMBRE = 100;
const MAX_DIRECCION = 1000;
const MAX_TELEFONO = 100;
const MAX_ALIAS = 150;
const MAX_PARROCO = 150;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

function trimOrNull(v: unknown, max: number): { ok: true; value: string | null } | { ok: false; error: string } {
  if (v === null || v === undefined) return { ok: true, value: null };
  if (typeof v !== 'string') return { ok: false, error: 'Tipo de dato inválido' };
  const trimmed = v.trim();
  if (trimmed.length > max) return { ok: false, error: `Longitud máxima excedida (${max})` };
  return { ok: true, value: trimmed.length === 0 ? null : trimmed };
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

async function getContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parishId) return null;
  const parishId = parseInt(session.user.parishId, 10);
  if (Number.isNaN(parishId)) return null;
  return { session, parishId };
}

export async function GET() {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canViewConfiguracion')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    const { parishId } = context;
    const parroquia = await prisma.parroquia.findUnique({
      where: { id_parroquia: parishId },
      select: { id_parroquia: true, nombre: true, direccion: true, telefono: true, email: true },
    });
    if (!parroquia) return NextResponse.json({ error: 'Parroquia no encontrada' }, { status: 404 });
    const config = await prisma.parroquiaConfig.findUnique({
      where: { id_parroquia: parishId },
      select: { alias_liturgico: true, parroco_nombre: true, logo_mime: true },
    });
    return NextResponse.json(jsonSafe({
      ...parroquia,
      alias_liturgico: config?.alias_liturgico ?? null,
      parroco_nombre: config?.parroco_nombre ?? null,
      tiene_logo: !!config?.logo_mime,
    }));
  } catch (error) {
    console.error('Error al obtener datos de la parroquia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canManageConfiguracion')) {
      return NextResponse.json({ error: 'No tienes permiso para modificar la configuración de la parroquia' }, { status: 403 });
    }
    const { parishId, session } = context;

    const data = await req.json();
    const nombreRes = requiredString(data.nombre, MAX_NOMBRE, 'Nombre');
    if (!nombreRes.ok) return badRequest(nombreRes.error);
    const direccionRes = requiredString(data.direccion, MAX_DIRECCION, 'Dirección');
    if (!direccionRes.ok) return badRequest(direccionRes.error);
    const telefonoRes = requiredString(data.telefono, MAX_TELEFONO, 'Teléfono');
    if (!telefonoRes.ok) return badRequest(telefonoRes.error);

    const emailRes = trimOrNull(data.email, 255);
    if (!emailRes.ok) return badRequest(emailRes.error);
    if (emailRes.value && !EMAIL_RE.test(emailRes.value)) {
      return badRequest('Email con formato inválido');
    }

    const aliasRes = trimOrNull(data.alias_liturgico, MAX_ALIAS);
    if (!aliasRes.ok) return badRequest(aliasRes.error);
    const parrocoRes = trimOrNull(data.parroco_nombre, MAX_PARROCO);
    if (!parrocoRes.ok) return badRequest(parrocoRes.error);

    const userId = BigInt(session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);

    const actualizada = await prisma.$transaction(async (tx) => {
      const previa = await tx.parroquia.findUnique({
        where: { id_parroquia: parishId },
        select: { nombre: true, direccion: true, telefono: true, email: true },
      });
      if (!previa) {
        throw new Error('PARROQUIA_NO_ENCONTRADA');
      }
      const configPrevia = await tx.parroquiaConfig.findUnique({
        where: { id_parroquia: parishId },
        select: { alias_liturgico: true, parroco_nombre: true },
      });

      const parroquiaActualizada = await tx.parroquia.update({
        where: { id_parroquia: parishId },
        data: {
          nombre: nombreRes.value,
          direccion: direccionRes.value,
          telefono: telefonoRes.value,
          email: emailRes.value,
        },
      });
      const configActualizada = await tx.parroquiaConfig.upsert({
        where: { id_parroquia: parishId },
        update: { alias_liturgico: aliasRes.value, parroco_nombre: parrocoRes.value },
        create: {
          id_parroquia: parishId,
          alias_liturgico: aliasRes.value,
          parroco_nombre: parrocoRes.value,
        },
      });

      const oldValues = jsonSafe({
        nombre: previa.nombre,
        direccion: previa.direccion,
        telefono: previa.telefono,
        email: previa.email,
        alias_liturgico: configPrevia?.alias_liturgico ?? null,
        parroco_nombre: configPrevia?.parroco_nombre ?? null,
      }) as import('@prisma/client').Prisma.InputJsonValue;
      const newValues = jsonSafe({
        nombre: parroquiaActualizada.nombre,
        direccion: parroquiaActualizada.direccion,
        telefono: parroquiaActualizada.telefono,
        email: parroquiaActualizada.email,
        alias_liturgico: configActualizada.alias_liturgico,
        parroco_nombre: configActualizada.parroco_nombre,
      }) as import('@prisma/client').Prisma.InputJsonValue;

      await registrarBitacora(tx, {
        parishId,
        userId,
        accion: 'U',
        nombreTabla: 'parroquia',
        idAfectado: BigInt(parishId),
        oldValues,
        newValues,
        actorIp,
        userAgent,
      });

      return {
        id_parroquia: parroquiaActualizada.id_parroquia,
        nombre: parroquiaActualizada.nombre,
        direccion: parroquiaActualizada.direccion,
        telefono: parroquiaActualizada.telefono,
        email: parroquiaActualizada.email,
        alias_liturgico: configActualizada.alias_liturgico,
        parroco_nombre: configActualizada.parroco_nombre,
      };
    });

    return NextResponse.json(jsonSafe(actualizada));
  } catch (error) {
    if (error instanceof Error && error.message === 'PARROQUIA_NO_ENCONTRADA') {
      return NextResponse.json({ error: 'Parroquia no encontrada' }, { status: 404 });
    }
    console.error('Error al actualizar datos de la parroquia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}