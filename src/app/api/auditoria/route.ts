import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { jsonSafe } from '@/lib/serialize';
import type { Prisma } from '@prisma/client';

const ACCIONES = ['C', 'R', 'U', 'D'];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.parishId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    // La auditoría es sensible: se restringe a quien puede ver reportes.
    if (!hasPermission(session.user.rol, 'canViewReportes')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    const parishId = parseInt(session.user.parishId, 10);
    if (Number.isNaN(parishId)) {
      return NextResponse.json({ error: 'Parroquia de sesión inválida' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));

    // Nunca se consulta otra parroquia: id_parroquia siempre de sesión.
    const where: Prisma.BitacoraCrudWhereInput = { id_parroquia: parishId };

    const tabla = searchParams.get('tabla')?.trim();
    if (tabla) where.nombre_tabla = tabla;

    const accion = searchParams.get('accion')?.trim().toUpperCase();
    if (accion && ACCIONES.includes(accion)) where.accion = accion;

    const usuario = searchParams.get('usuario')?.trim();
    if (usuario) {
      try {
        where.id_usuario = BigInt(usuario);
      } catch {
        return NextResponse.json({ error: 'Usuario inválido' }, { status: 400 });
      }
    }

    const idAfectado = searchParams.get('idAfectado')?.trim();
    if (idAfectado) {
      try {
        where.id_tabla_afectado = BigInt(idAfectado);
      } catch {
        return NextResponse.json({ error: 'Id afectado inválido' }, { status: 400 });
      }
    }

    const desde = searchParams.get('desde')?.trim();
    const hasta = searchParams.get('hasta')?.trim();
    const fecha: Prisma.DateTimeFilter = {};
    if (desde) {
      const d = new Date(desde);
      if (!Number.isNaN(d.getTime())) fecha.gte = d;
    }
    if (hasta) {
      const h = new Date(hasta);
      if (!Number.isNaN(h.getTime())) {
        h.setDate(h.getDate() + 1); // inclusivo del día "hasta"
        fecha.lt = h;
      }
    }
    if (fecha.gte || fecha.lt) where.fecha = fecha;

    const [total, items] = await Promise.all([
      prisma.bitacoraCrud.count({ where }),
      prisma.bitacoraCrud.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Resolver nombres de usuario (no hay relación en Prisma) dentro del tenant.
    const idsUsuario = [...new Set(items.map((i) => i.id_usuario))];
    const usuarios = idsUsuario.length
      ? await prisma.usuario.findMany({
          where: { id_usuario: { in: idsUsuario }, id_parroquia: parishId },
          select: { id_usuario: true, nombre: true },
        })
      : [];
    const nombrePorId = new Map(usuarios.map((u) => [u.id_usuario.toString(), u.nombre]));

    const data = items.map((i) => ({
      ...jsonSafe(i) as Record<string, unknown>,
      usuario_nombre: nombrePorId.get(i.id_usuario.toString()) ?? null,
    }));

    return NextResponse.json({ data, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('Error al consultar auditoría:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
