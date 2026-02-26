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

    const sectores = await prisma.sectorParroquial.findMany({
      include: {
        parroquia: {
          select: {
            nombre: true
          }
        },
        tipoSector: {
          select: {
            nombre: true,
            descripcion: true
          }
        },
        _count: {
          select: {
            miembros: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return NextResponse.json(sectores);
  } catch (error) {
    console.error('Error al obtener sectores parroquiales:', error);
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
    const { 
      id_parroquia, 
      id_tipo_sector_parroquial, 
      nombre, 
      nombre_capilla,
      direccion,
      telefono,
      responsable 
    } = body;

    // Validaciones básicas
    if (!id_parroquia || !id_tipo_sector_parroquial || !nombre) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const nuevoSector = await prisma.sectorParroquial.create({
      data: {
        id_parroquia,
        id_tipo_sector_parroquial,
        nombre,
        nombre_capilla,
        direccion,
        telefono,
        responsable
      },
      include: {
        parroquia: {
          select: {
            nombre: true
          }
        },
        tipoSector: {
          select: {
            nombre: true,
            descripcion: true
          }
        },
        _count: {
          select: {
            miembros: true
          }
        }
      }
    });

    return NextResponse.json(nuevoSector, { status: 201 });
  } catch (error) {
    console.error('Error al crear sector parroquial:', error);
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
    const { 
      id_sector_parroquial,
      id_parroquia, 
      id_tipo_sector_parroquial, 
      nombre, 
      nombre_capilla,
      direccion,
      telefono,
      responsable 
    } = body;

    if (!id_sector_parroquial) {
      return NextResponse.json(
        { error: 'ID del sector es requerido' },
        { status: 400 }
      );
    }

    const sectorActualizado = await prisma.sectorParroquial.update({
      where: { id_sector_parroquial },
      data: {
        id_parroquia,
        id_tipo_sector_parroquial,
        nombre,
        nombre_capilla,
        direccion,
        telefono,
        responsable
      },
      include: {
        parroquia: {
          select: {
            nombre: true
          }
        },
        tipoSector: {
          select: {
            nombre: true,
            descripcion: true
          }
        },
        _count: {
          select: {
            miembros: true
          }
        }
      }
    });

    return NextResponse.json(sectorActualizado);
  } catch (error) {
    console.error('Error al actualizar sector parroquial:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID del sector es requerido' },
        { status: 400 }
      );
    }

    // Verificar si el sector tiene miembros asociados
    const sector = await prisma.sectorParroquial.findUnique({
      where: { id_sector_parroquial: parseInt(id) },
      include: {
        _count: {
          select: {
            miembros: true
          }
        }
      }
    });

    if (!sector) {
      return NextResponse.json(
        { error: 'Sector no encontrado' },
        { status: 404 }
      );
    }

    if (sector._count.miembros > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un sector que tiene miembros asociados' },
        { status: 400 }
      );
    }

    await prisma.sectorParroquial.delete({
      where: { id_sector_parroquial: parseInt(id) }
    });

    return NextResponse.json({ message: 'Sector eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar sector parroquial:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}