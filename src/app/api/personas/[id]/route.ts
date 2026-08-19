import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getParishContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parishId) return null;

  const parishId = parseInt(session.user.parishId, 10);
  if (Number.isNaN(parishId)) return null;

  return { session, parishId };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await getParishContext();
    if (!context) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: numeroIdentidad } = await params;

    const persona = await prisma.persona.findUnique({
      where: {
        id_parroquia_numero_identidad: {
          id_parroquia: context.parishId,
          numero_identidad: numeroIdentidad
        }
      },
      include: {
        sector: { select: { nombre: true } },
        orden_religiosa: { select: { nombre: true } },
        municipio_nacimiento: {
          select: {
            nombre_municipio: true,
            departamento: { select: { nombre_departamento: true } }
          }
        }
      }
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      ...persona,
      id_sector_parroquial: persona.id_sector_parroquial?.toString(),
      id_orden_religiosa: persona.id_orden_religiosa?.toString()
    });
  } catch (error) {
    console.error('Error al obtener persona:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await getParishContext();
    if (!context) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: numeroIdentidad } = await params;
    const data = await req.json();

    const personaActualizada = await prisma.persona.update({
      where: {
        id_parroquia_numero_identidad: {
          id_parroquia: context.parishId,
          numero_identidad: numeroIdentidad
        }
      },
      data: {
        nombres: data.nombres,
        apellidos: data.apellidos,
        fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : undefined,
        lugar_nacimiento: data.lugar_nacimiento,
        sexo: data.sexo,
        telefono: data.telefono,
        email: data.email,
        direccion: data.direccion,
        id_sector_parroquial: data.id_sector_parroquial ? BigInt(data.id_sector_parroquial) : undefined,
        id_orden_religiosa: data.id_orden_religiosa ? parseInt(data.id_orden_religiosa, 10) : undefined,
        estado_vital: data.estado_vital !== undefined ? parseInt(data.estado_vital, 10) : undefined,
        estado_activo_parroquia: data.estado_activo_parroquia !== undefined ? parseInt(data.estado_activo_parroquia, 10) : undefined,
        otra_orden_religiosa: data.otra_orden_religiosa,
        imagen: data.imagen
      },
      include: {
        sector: { select: { nombre: true } },
        orden_religiosa: { select: { nombre: true } },
        municipio_nacimiento: {
          select: {
            nombre_municipio: true,
            departamento: { select: { nombre_departamento: true } }
          }
        }
      }
    });

    return NextResponse.json({
      ...personaActualizada,
      id_sector_parroquial: personaActualizada.id_sector_parroquial?.toString(),
      id_orden_religiosa: personaActualizada.id_orden_religiosa?.toString()
    });
  } catch (error) {
    console.error('Error al actualizar persona:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await getParishContext();
    if (!context) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: numeroIdentidad } = await params;

    const personaExistente = await prisma.persona.findUnique({
      where: {
        id_parroquia_numero_identidad: {
          id_parroquia: context.parishId,
          numero_identidad: numeroIdentidad
        }
      }
    });

    if (!personaExistente) {
      return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 });
    }

    await prisma.persona.delete({
      where: {
        id_parroquia_numero_identidad: {
          id_parroquia: context.parishId,
          numero_identidad: numeroIdentidad
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar persona:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
