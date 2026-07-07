import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantScope, withTenantTransaction } from '@/lib/prisma-tenant';
import { logBitacoraCrud } from '@/lib/bitacora';
import { hashPassword } from '@/lib/password';
import { ForbiddenError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import {
  assertParishAccess,
  handleApiError,
  requireTenantWithPermission,
} from '@/lib/tenant';
import { safeParseBody } from '@/lib/validation';
import { usuarioCreateSchema, usuarioUpdateSchema } from '@/lib/validators/schemas';

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
      nombre: usuario.parroquia.nombre,
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const { parishId } = await requireTenantWithPermission(PAGES.USUARIOS, 'ver');
    const { searchParams } = new URL(req.url);
    const requestedParish = searchParams.get('parroquiaId');

    if (requestedParish) {
      assertParishAccess(parseInt(requestedParish, 10), parishId);
    }

    const usuarios = await withTenantScope(parishId, (db) =>
      db.usuario.findMany({
        where: { id_parroquia: parishId },
        include: {
          parroquia: { select: { id_parroquia: true, nombre: true } },
          rol: { select: { nombre: true } },
        },
        orderBy: { fecha_creacion: 'desc' },
      })
    );

    return NextResponse.json(usuarios.map(formatUsuario));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.USUARIOS, 'crear');
    const body = await req.json();
    const validated = safeParseBody(usuarioCreateSchema, body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { nombre, email, telefono, password, rol, activo, parroquiaId } =
      validated.data;

    assertParishAccess(
      parroquiaId !== undefined ? parseInt(String(parroquiaId), 10) : ctx.parishId,
      ctx.parishId
    );

    const existingUser = await withTenantScope(ctx.parishId, (db) =>
      db.usuario.findFirst({ where: { email } })
    );
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 409 }
      );
    }

    const rolData = await prisma.rolUsuario.findFirst({ where: { nombre: rol } });
    if (!rolData) {
      return NextResponse.json({ error: 'Rol no válido' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const nuevoUsuario = await withTenantTransaction(ctx.parishId, async (tx) => {
      const created = await tx.usuario.create({
        data: {
          nombre,
          email,
          telefono,
          contrasena: hashedPassword,
          id_rol: rolData.id_rol,
          estado: activo !== false ? 1 : 0,
          id_parroquia: ctx.parishId,
          id_usuario_creacion: ctx.userId,
        },
        include: {
          parroquia: { select: { id_parroquia: true, nombre: true } },
          rol: { select: { nombre: true } },
        },
      });

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'C',
        nombreTabla: 'usuario',
        idTabla: created.id_usuario,
        newValues: { email, nombre },
      });

      return created;
    });

    return NextResponse.json(formatUsuario(nuevoUsuario), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.USUARIOS, 'actualizar');
    const body = await req.json();
    const validated = safeParseBody(usuarioUpdateSchema, body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { id, nombre, email, telefono, rol, activo, password } = validated.data;

    const existingUser = await withTenantScope(ctx.parishId, (db) =>
      db.usuario.findFirst({
        where: {
          id_usuario: BigInt(id),
          id_parroquia: ctx.parishId,
        },
      })
    );

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (email !== undefined) {
      const emailInUse = await withTenantScope(ctx.parishId, (db) =>
        db.usuario.findFirst({
          where: { email, id_usuario: { not: BigInt(id) } },
        })
      );
      if (emailInUse) {
        return NextResponse.json(
          { error: 'El email ya está en uso por otro usuario' },
          { status: 409 }
        );
      }
      updateData.email = email;
    }
    if (telefono !== undefined) updateData.telefono = telefono;
    if (rol !== undefined) {
      const rolData = await prisma.rolUsuario.findFirst({ where: { nombre: rol } });
      if (!rolData) {
        return NextResponse.json({ error: 'Rol no válido' }, { status: 400 });
      }
      updateData.id_rol = rolData.id_rol;
    }
    if (activo !== undefined) updateData.estado = activo ? 1 : 0;
    if (password && password.trim() !== '') {
      updateData.contrasena = await hashPassword(password);
    }

    const usuarioActualizado = await withTenantTransaction(ctx.parishId, async (tx) => {
      const updated = await tx.usuario.update({
        where: { id_usuario: BigInt(id) },
        data: updateData,
        include: {
          parroquia: { select: { id_parroquia: true, nombre: true } },
          rol: { select: { nombre: true } },
        },
      });

      await logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'U',
        nombreTabla: 'usuario',
        idTabla: BigInt(id),
        newValues: { email: updated.email, nombre: updated.nombre },
      });

      return updated;
    });

    if (usuarioActualizado.id_parroquia !== ctx.parishId) {
      throw new ForbiddenError();
    }

    return NextResponse.json(formatUsuario(usuarioActualizado));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireTenantWithPermission(PAGES.USUARIOS, 'borrar');
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    if (BigInt(id) === ctx.userId) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propio usuario' },
        { status: 400 }
      );
    }

    const result = await withTenantTransaction(ctx.parishId, async (tx) => {
      const deleted = await tx.usuario.deleteMany({
        where: {
          id_usuario: BigInt(id),
          id_parroquia: ctx.parishId,
        },
      });

      if (deleted.count > 0) {
        await logBitacoraCrud(tx, {
          parishId: ctx.parishId,
          userId: ctx.userId,
          accion: 'D',
          nombreTabla: 'usuario',
          idTabla: BigInt(id),
        });
      }

      return deleted;
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    return handleApiError(error);
  }
}
