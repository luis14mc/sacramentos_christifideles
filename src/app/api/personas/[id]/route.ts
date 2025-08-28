import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const numeroIdentidad = params.id;

    const persona = await prisma.persona.findFirst({
      where: {
        numero_identidad: numeroIdentidad
      },
      include: {
        sector: {
          select: {
            nombre: true
          }
        },
        orden_religiosa: {
          select: {
            nombre: true
          }
        },
        municipio_nacimiento: {
          select: {
            nombre_municipio: true,
            departamento: {
              select: {
                nombre_departamento: true
              }
            }
          }
        }
      }
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 });
    }

    return NextResponse.json(persona);
  } catch (error) {
    console.error('Error al obtener persona:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const numeroIdentidad = params.id;
    const data = await req.json();

    const personaActualizada = await prisma.persona.update({
      where: {
        id_parroquia_numero_identidad: {
          id_parroquia: data.id_parroquia || 1,
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
        id_sector_parroquial: data.id_sector_parroquial ? parseInt(data.id_sector_parroquial) : undefined,
        id_orden_religiosa: data.id_orden_religiosa ? parseInt(data.id_orden_religiosa) : undefined,
        estado_vital: data.estado_vital,
        estado_activo_parroquia: data.estado_activo_parroquia,
        otra_orden_religiosa: data.otra_orden_religiosa,
        imagen: data.imagen
      },
      include: {
        sector: {
          select: {
            nombre: true
          }
        },
        orden_religiosa: {
          select: {
            nombre: true
          }
        },
        municipio_nacimiento: {
          select: {
            nombre_municipio: true,
            departamento: {
              select: {
                nombre_departamento: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(personaActualizada);
  } catch (error) {
    console.error('Error al actualizar persona:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const numeroIdentidad = params.id;

    await prisma.persona.delete({
      where: {
        id_parroquia_numero_identidad: {
          id_parroquia: 1, // Se obtendrá de la sesión del usuario
          numero_identidad: numeroIdentidad
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar persona:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
