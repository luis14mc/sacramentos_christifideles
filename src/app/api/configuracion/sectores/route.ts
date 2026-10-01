import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { contextoAuditoria, registrarBitacora } from '@/lib/bitacora';
import { idTipoSectorGeneral } from '@/lib/sectores';
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

export async function GET() {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canViewConfiguracion')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    const sectores = await prisma.sectorParroquial.findMany({
      where: { id_parroquia: context.parishId },
      orderBy: { nombre: 'asc' },
      include: { tipo_sector: { select: { nombre: true } } },
    });
    const serializados = sectores.map((s) => ({
      ...s,
      id_sector_parroquial: s.id_sector_parroquial.toString(),
    }));
    return NextResponse.json(jsonSafe(serializados));
  } catch (error) {
    console.error('Error al listar sectores:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canManageConfiguracion')) {
      return NextResponse.json({ error: 'No tienes permiso para modificar sectores' }, { status: 403 });
    }
    const { parishId, session } = context;
    const data = await req.json();

    const nombreRes = requiredString(data.nombre, MAX_NOMBRE, 'Nombre');
    if (!nombreRes.ok) return badRequest(nombreRes.error);
    const direccionRes = requiredString(data.direccion, MAX_DIRECCION, 'Dirección');
    if (!direccionRes.ok) return badRequest(direccionRes.error);
    const capillaRes = optionalString(data.nombre_capilla, MAX_CAPILLA);
    if (!capillaRes.ok) return badRequest(capillaRes.error);

    const userId = BigInt(session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);

    const creado = await prisma.$transaction(async (tx) => {
      // El tipo no se pide al usuario: el nombre describe el sector.
      const idTipo = await idTipoSectorGeneral(tx);
      const s = await tx.sectorParroquial.create({
        data: {
          id_parroquia: parishId,
          id_tipo_sector_parroquial: idTipo,
          nombre: nombreRes.value,
          nombre_capilla: capillaRes.value,
          direccion: direccionRes.value,
        },
      });
      await registrarBitacora(tx, {
        parishId,
        userId,
        accion: 'C',
        nombreTabla: 'sector_parroquial',
        idAfectado: s.id_sector_parroquial,
        newValues: jsonSafe({
          nombre: nombreRes.value,
          nombre_capilla: capillaRes.value,
          direccion: direccionRes.value,
        }) as import('@prisma/client').Prisma.InputJsonValue,
        actorIp,
        userAgent,
      });
      return s;
    });

    return NextResponse.json(jsonSafe({
      ...creado,
      id_sector_parroquial: creado.id_sector_parroquial.toString(),
    }), { status: 201 });
  } catch (error) {
    console.error('Error al crear sector:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}