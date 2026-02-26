import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener todos los permisos con sus asignaciones por rol
    const permisos = await prisma.pagina.findMany({
      include: {
        permisos: {
          include: {
            rol: {
              select: {
                id_rol: true,
                nombre: true
              }
            }
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // Obtener todos los roles
    const roles = await prisma.rolUsuario.findMany({
      where: {
        estado: 1
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return NextResponse.json({
      permisos,
      roles
    });
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id_rol, id_pagina, permisos } = body;

    // Validaciones básicas
    if (!id_rol || !id_pagina || !permisos) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Eliminar permisos existentes para este rol y página
    await prisma.permiso.deleteMany({
      where: {
        id_rol,
        id_pagina
      }
    });

    // Crear nuevos permisos
    const nuevosPermisos = [];
    if (permisos.leer) {
      nuevosPermisos.push({
        id_rol,
        id_pagina,
        accion: 'leer'
      });
    }
    if (permisos.escribir) {
      nuevosPermisos.push({
        id_rol,
        id_pagina,
        accion: 'escribir'
      });
    }
    if (permisos.eliminar) {
      nuevosPermisos.push({
        id_rol,
        id_pagina,
        accion: 'eliminar'
      });
    }
    if (permisos.administrar) {
      nuevosPermisos.push({
        id_rol,
        id_pagina,
        accion: 'administrar'
      });
    }

    if (nuevosPermisos.length > 0) {
      await prisma.permiso.createMany({
        data: nuevosPermisos
      });
    }

    return NextResponse.json({ message: 'Permisos actualizados exitosamente' });
  } catch (error) {
    console.error('Error al actualizar permisos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { rol_id, permisos_bulk } = body;

    if (!rol_id || !permisos_bulk) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Eliminar todos los permisos existentes para este rol
    await prisma.permiso.deleteMany({
      where: {
        id_rol: rol_id
      }
    });

    // Crear nuevos permisos en lote
    const nuevosPermisos = [];
    for (const [id_pagina, acciones] of Object.entries(permisos_bulk)) {
      const pagina_id = parseInt(id_pagina);
      const accionesObj = acciones as { [key: string]: boolean };
      
      for (const [accion, permitido] of Object.entries(accionesObj)) {
        if (permitido) {
          nuevosPermisos.push({
            id_rol: rol_id,
            id_pagina: pagina_id,
            accion
          });
        }
      }
    }

    if (nuevosPermisos.length > 0) {
      await prisma.permiso.createMany({
        data: nuevosPermisos
      });
    }

    return NextResponse.json({ message: 'Permisos actualizados exitosamente' });
  } catch (error) {
    console.error('Error al actualizar permisos en lote:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}