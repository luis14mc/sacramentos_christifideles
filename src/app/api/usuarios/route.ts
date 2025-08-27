import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parroquiaId = searchParams.get('parroquiaId');

    if (!parroquiaId) {
      return NextResponse.json({ error: 'ID de parroquia requerido' }, { status: 400 });
    }

    const usuarios = await prisma.usuario.findMany({
      where: {
        id_parroquia: parseInt(parroquiaId)
      },
      include: {
        parroquia: {
          select: {
            id_parroquia: true,
            nombre: true
          }
        },
        rol: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        fecha_creacion: 'desc'
      }
    });

    // Mapear a la estructura esperada por el frontend
    const usuariosFormatted = usuarios.map(usuario => ({
      id: Number(usuario.id_usuario),
      nombre: usuario.nombre,
      email: usuario.email,
      telefono: usuario.telefono || '',
      rol: usuario.rol.nombre,
      activo: usuario.estado === 1,
      createdAt: usuario.fecha_creacion.toISOString(),
      updatedAt: usuario.fecha_creacion.toISOString(), // No tenemos updatedAt en el esquema actual
      parroquia: {
        id: usuario.parroquia.id_parroquia,
        nombre: usuario.parroquia.nombre
      }
    }));

    return NextResponse.json(usuariosFormatted);
  } catch (error) {
    console.error('Error fetching usuarios:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { nombre, email, telefono, password, rol, activo, parroquiaId } = body;

    // Validar datos requeridos
    if (!nombre || !email || !password || !rol || !parroquiaId) {
      return NextResponse.json({ 
        error: 'Datos requeridos: nombre, email, password, rol, parroquiaId' 
      }, { status: 400 });
    }

    // Validar que el email no exista
    const existingUser = await prisma.usuario.findFirst({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Ya existe un usuario con este email' 
      }, { status: 409 });
    }

    // Buscar el rol por nombre
    const rolData = await prisma.rolUsuario.findFirst({
      where: { nombre: rol }
    });

    if (!rolData) {
      return NextResponse.json({ 
        error: 'Rol no válido' 
      }, { status: 400 });
    }

    // Encriptar password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        telefono,
        contrasena: Buffer.from(hashedPassword),
        id_rol: rolData.id_rol,
        estado: activo !== false ? 1 : 0,
        id_parroquia: parseInt(parroquiaId),
        id_usuario_creacion: BigInt(session.user.id)
      },
      include: {
        parroquia: {
          select: {
            id_parroquia: true,
            nombre: true
          }
        },
        rol: {
          select: {
            nombre: true
          }
        }
      }
    });

    // Mapear a la estructura esperada
    const usuarioFormatted = {
      id: Number(nuevoUsuario.id_usuario),
      nombre: nuevoUsuario.nombre,
      email: nuevoUsuario.email,
      telefono: nuevoUsuario.telefono || '',
      rol: nuevoUsuario.rol.nombre,
      activo: nuevoUsuario.estado === 1,
      createdAt: nuevoUsuario.fecha_creacion.toISOString(),
      updatedAt: nuevoUsuario.fecha_creacion.toISOString(),
      parroquia: {
        id: nuevoUsuario.parroquia.id_parroquia,
        nombre: nuevoUsuario.parroquia.nombre
      }
    };

    return NextResponse.json(usuarioFormatted, { status: 201 });
  } catch (error) {
    console.error('Error creating usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id, nombre, email, telefono, rol, activo, password } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id_usuario: BigInt(id) }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {};
    
    if (nombre !== undefined) updateData.nombre = nombre;
    if (email !== undefined) {
      // Validar que el email no esté en uso por otro usuario
      const emailInUse = await prisma.usuario.findFirst({
        where: { 
          email,
          id_usuario: { not: BigInt(id) }
        }
      });

      if (emailInUse) {
        return NextResponse.json({ 
          error: 'El email ya está en uso por otro usuario' 
        }, { status: 409 });
      }
      updateData.email = email;
    }
    if (telefono !== undefined) updateData.telefono = telefono;
    if (rol !== undefined) {
      // Buscar el rol por nombre
      const rolData = await prisma.rolUsuario.findFirst({
        where: { nombre: rol }
      });

      if (!rolData) {
        return NextResponse.json({ 
          error: 'Rol no válido' 
        }, { status: 400 });
      }
      updateData.id_rol = rolData.id_rol;
    }
    if (activo !== undefined) updateData.estado = activo ? 1 : 0;
    
    // Solo actualizar password si se proporciona
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateData.contrasena = Buffer.from(hashedPassword);
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id_usuario: BigInt(id) },
      data: updateData,
      include: {
        parroquia: {
          select: {
            id_parroquia: true,
            nombre: true
          }
        },
        rol: {
          select: {
            nombre: true
          }
        }
      }
    });

    // Mapear a la estructura esperada
    const usuarioFormatted = {
      id: Number(usuarioActualizado.id_usuario),
      nombre: usuarioActualizado.nombre,
      email: usuarioActualizado.email,
      telefono: usuarioActualizado.telefono || '',
      rol: usuarioActualizado.rol.nombre,
      activo: usuarioActualizado.estado === 1,
      createdAt: usuarioActualizado.fecha_creacion.toISOString(),
      updatedAt: usuarioActualizado.fecha_creacion.toISOString(),
      parroquia: {
        id: usuarioActualizado.parroquia.id_parroquia,
        nombre: usuarioActualizado.parroquia.nombre
      }
    };

    return NextResponse.json(usuarioFormatted);
  } catch (error) {
    console.error('Error updating usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id_usuario: BigInt(id) }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // No permitir eliminar el propio usuario
    if (BigInt(id) === BigInt(session.user.id)) {
      return NextResponse.json({ 
        error: 'No puedes eliminar tu propio usuario' 
      }, { status: 400 });
    }

    await prisma.usuario.delete({
      where: { id_usuario: BigInt(id) }
    });

    return NextResponse.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
