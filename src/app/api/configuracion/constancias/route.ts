import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { jsonSafe } from '@/lib/serialize';
import { contextoAuditoria, registrarBitacora } from '@/lib/bitacora';
import { isPrismaUniqueError } from '@/lib/sacramentos';
import { esSacramentoConstancia } from '@/lib/constancias';

async function getContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parishId) return null;
  const parishId = parseInt(session.user.parishId, 10);
  if (Number.isNaN(parishId)) return null;
  return { session, parishId };
}

const DUPLICADO = 'Ya existe una plantilla con ese nombre para ese sacramento en la parroquia.';

export async function GET() {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canViewConfiguracion')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    const plantillas = await prisma.plantillaConstancia.findMany({
      where: { id_parroquia: context.parishId },
      orderBy: [{ sacramento: 'asc' }, { nombre: 'asc' }],
    });
    return NextResponse.json(jsonSafe(plantillas));
  } catch (error) {
    console.error('Error al listar plantillas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canManageConfiguracion')) {
      return NextResponse.json({ error: 'No tienes permiso para gestionar plantillas' }, { status: 403 });
    }
    const { parishId } = context;
    const data = await req.json();

    const sacramento = String(data.sacramento || '').trim();
    const nombre = String(data.nombre || '').trim();
    const contenido = typeof data.contenido === 'string' ? data.contenido : '';
    const activo = data.activo !== false;
    if (!esSacramentoConstancia(sacramento)) {
      return NextResponse.json({ error: 'Sacramento inválido' }, { status: 400 });
    }
    if (!nombre) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    if (!contenido.trim()) return NextResponse.json({ error: 'El contenido es obligatorio' }, { status: 400 });

    const userId = BigInt(context.session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);

    const creada = await prisma.$transaction(async (tx) => {
      const p = await tx.plantillaConstancia.create({
        data: { id_parroquia: parishId, sacramento, nombre, contenido, activo },
      });
      await registrarBitacora(tx, {
        parishId,
        userId,
        accion: 'C',
        nombreTabla: 'plantilla_constancia',
        idAfectado: p.id,
        newValues: { sacramento, nombre, activo },
        actorIp,
        userAgent,
      });
      return p;
    });

    return NextResponse.json(jsonSafe(creada), { status: 201 });
  } catch (error) {
    if (isPrismaUniqueError(error)) return NextResponse.json({ error: DUPLICADO }, { status: 409 });
    console.error('Error al crear plantilla:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canManageConfiguracion')) {
      return NextResponse.json({ error: 'No tienes permiso para gestionar plantillas' }, { status: 403 });
    }
    const { parishId } = context;
    const data = await req.json();

    let id: bigint;
    try {
      id = BigInt(data.id);
    } catch {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }

    const existente = await prisma.plantillaConstancia.findFirst({
      where: { id, id_parroquia: parishId },
    });
    if (!existente) return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });

    const update: { nombre?: string; contenido?: string; activo?: boolean } = {};
    if (data.nombre !== undefined) {
      const nombre = String(data.nombre).trim();
      if (!nombre) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
      update.nombre = nombre;
    }
    if (data.contenido !== undefined) {
      if (!String(data.contenido).trim()) return NextResponse.json({ error: 'El contenido es obligatorio' }, { status: 400 });
      update.contenido = String(data.contenido);
    }
    if (data.activo !== undefined) update.activo = Boolean(data.activo);

    const userId = BigInt(context.session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);

    const actualizada = await prisma.$transaction(async (tx) => {
      const p = await tx.plantillaConstancia.update({ where: { id }, data: update });
      await registrarBitacora(tx, {
        parishId,
        userId,
        accion: 'U',
        nombreTabla: 'plantilla_constancia',
        idAfectado: id,
        oldValues: jsonSafe(existente) as import('@prisma/client').Prisma.InputJsonValue,
        newValues: update as import('@prisma/client').Prisma.InputJsonValue,
        actorIp,
        userAgent,
      });
      return p;
    });

    return NextResponse.json(jsonSafe(actualizada));
  } catch (error) {
    if (isPrismaUniqueError(error)) return NextResponse.json({ error: DUPLICADO }, { status: 409 });
    console.error('Error al actualizar plantilla:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
