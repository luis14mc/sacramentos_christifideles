import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { hasPermission, normalizeRole } from '@/lib/permissions';
import { contextoAuditoria, registrarBitacora } from '@/lib/bitacora';

// Super Admin es un rol de alcance global: solo un Super Admin puede asignarlo.
// Evita escalación de privilegios desde Admin Parroquia u otros roles locales.
const GLOBAL_ROLE = 'super admin';
function canAssignRole(actorRole: string | null | undefined, targetRole: string): boolean {
  if (normalizeRole(targetRole) !== GLOBAL_ROLE) return true;
  return normalizeRole(actorRole) === GLOBAL_ROLE;
}

async function getParishContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parishId) return null;

  const parishId = parseInt(session.user.parishId, 10);
  if (Number.isNaN(parishId)) return null;

  return { session, parishId };
}

function formatUsuario(usuario: {
  id_usuario: bigint;
  nombre: string;
  email: string;
  telefono: string | null;
  estado: number;
  fecha_creacion: Date;
  parroquia: { id_parroquia: number; nombre: string };
  rol: { nombre: string };
}) {
  return {
    id: Number(usuario.id_usuario),
    nombre: usuario.nombre,
    email: usuario.email,
    telefono: usuario.telefono || '',
    rol: usuario.rol.nombre,
    activo: usuario.estado === 1,
    createdAt: usuario.fecha_creacion.toISOString(),
    updatedAt: usuario.fecha_creacion.toISOString(),
    parroquia: {
      id: usuario.parroquia.id_parroquia,
      nombre: usuario.parroquia.nombre
    }
  };
}

export async function GET() {
  try {
    const context = await getParishContext();
    if (!context) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(context.session.user.rol, 'canViewUsuarios')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const usuarios = await prisma.usuario.findMany({
      where: { id_parroquia: context.parishId },
      include: {
        parroquia: { select: { id_parroquia: true, nombre: true } },
        rol: { select: { nombre: true } }
      },
      orderBy: { fecha_creacion: 'desc' }
    });

    return NextResponse.json(usuarios.map(formatUsuario));
  } catch (error) {
    console.error('Error fetching usuarios:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getParishContext();
    if (!context) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(context.session.user.rol, 'canManageUsuarios')) {
      return NextResponse.json({ error: 'No tienes permiso para crear usuarios' }, { status: 403 });
    }

    const body = await req.json();
    const { nombre, email, telefono, password, rol, activo } = body;

    if (!nombre || !email || !password || !rol) {
      return NextResponse.json({ error: 'Datos requeridos: nombre, email, password, rol' }, { status: 400 });
    }

    const existingUser = await prisma.usuario.findFirst({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Ya existe un usuario con este email' }, { status: 409 });
    }

    const rolData = await prisma.rolUsuario.findFirst({ where: { nombre: rol } });
    if (!rolData) {
      return NextResponse.json({ error: 'Rol no válido' }, { status: 400 });
    }

    if (!canAssignRole(context.session.user.rol, rolData.nombre)) {
      return NextResponse.json({ error: 'No puedes asignar el rol Super Admin' }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userId = BigInt(context.session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);

    const nuevoUsuario = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nombre,
          email,
          telefono,
          contrasena: Buffer.from(hashedPassword),
          id_rol: rolData.id_rol,
          estado: activo !== false ? 1 : 0,
          id_parroquia: context.parishId,
          id_usuario_creacion: userId
        },
        include: {
          parroquia: { select: { id_parroquia: true, nombre: true } },
          rol: { select: { nombre: true } }
        }
      });
      await registrarBitacora(tx, {
        parishId: context.parishId,
        userId,
        accion: 'C',
        nombreTabla: 'usuario',
        idAfectado: usuario.id_usuario,
        newValues: { nombre, email, rol: rolData.nombre },
        actorIp,
        userAgent
      });
      return usuario;
    });

    return NextResponse.json(formatUsuario(nuevoUsuario), { status: 201 });
  } catch (error) {
    console.error('Error creating usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const context = await getParishContext();
    if (!context) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(context.session.user.rol, 'canManageUsuarios')) {
      return NextResponse.json({ error: 'No tienes permiso para editar usuarios' }, { status: 403 });
    }

    const body = await req.json();
    const { id, nombre, email, telefono, rol, activo, password } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    const existingUser = await prisma.usuario.findFirst({
      where: { id_usuario: BigInt(id), id_parroquia: context.parishId }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (email !== undefined) {
      const emailInUse = await prisma.usuario.findFirst({
        where: { email, id_usuario: { not: BigInt(id) } }
      });
      if (emailInUse) {
        return NextResponse.json({ error: 'El email ya está en uso por otro usuario' }, { status: 409 });
      }
      updateData.email = email;
    }
    if (telefono !== undefined) updateData.telefono = telefono;
    if (rol !== undefined) {
      const rolData = await prisma.rolUsuario.findFirst({ where: { nombre: rol } });
      if (!rolData) {
        return NextResponse.json({ error: 'Rol no válido' }, { status: 400 });
      }
      if (!canAssignRole(context.session.user.rol, rolData.nombre)) {
        return NextResponse.json({ error: 'No puedes asignar el rol Super Admin' }, { status: 403 });
      }
      updateData.id_rol = rolData.id_rol;
    }
    if (activo !== undefined) updateData.estado = activo ? 1 : 0;
    if (password && password.trim() !== '') {
      updateData.contrasena = Buffer.from(await bcrypt.hash(password, 12));
    }

    const userId = BigInt(context.session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);

    const usuarioActualizado = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
        where: { id_usuario: BigInt(id) },
        data: updateData,
        include: {
          parroquia: { select: { id_parroquia: true, nombre: true } },
          rol: { select: { nombre: true } }
        }
      });
      await registrarBitacora(tx, {
        parishId: context.parishId,
        userId,
        accion: 'U',
        nombreTabla: 'usuario',
        idAfectado: BigInt(id),
        newValues: { campos: Object.keys(updateData) },
        actorIp,
        userAgent
      });
      return usuario;
    });

    return NextResponse.json(formatUsuario(usuarioActualizado));
  } catch (error) {
    console.error('Error updating usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const context = await getParishContext();
    if (!context) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(context.session.user.rol, 'canManageUsuarios')) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar usuarios' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    const existingUser = await prisma.usuario.findFirst({
      where: { id_usuario: BigInt(id), id_parroquia: context.parishId }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (BigInt(id) === BigInt(context.session.user.id)) {
      return NextResponse.json({ error: 'No puedes eliminar tu propio usuario' }, { status: 400 });
    }

    const userId = BigInt(context.session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);

    await prisma.$transaction(async (tx) => {
      await tx.usuario.delete({ where: { id_usuario: BigInt(id) } });
      await registrarBitacora(tx, {
        parishId: context.parishId,
        userId,
        accion: 'D',
        nombreTabla: 'usuario',
        idAfectado: BigInt(id),
        oldValues: { nombre: existingUser.nombre, email: existingUser.email },
        actorIp,
        userAgent
      });
    });

    return NextResponse.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
