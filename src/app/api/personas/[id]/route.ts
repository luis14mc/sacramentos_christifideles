import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { hasPermission } from '@/lib/permissions';

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

    if (!hasPermission(context.session.user.rol, 'canViewPersonas')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
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

    if (!hasPermission(context.session.user.rol, 'canManagePersonas')) {
      return NextResponse.json({ error: 'No tienes permiso para editar personas' }, { status: 403 });
    }

    const { id: numeroIdentidad } = await params;
    const data = await req.json();

    // Si se reasigna el sector, debe existir y pertenecer a la MISMA parroquia
    // (nunca confiar en el id de sector recibido del cliente como autorización).
    if (data.id_sector_parroquial !== undefined && data.id_sector_parroquial !== null && data.id_sector_parroquial !== '') {
      let sectorId: bigint;
      try {
        sectorId = BigInt(data.id_sector_parroquial);
      } catch {
        return NextResponse.json({ error: 'Sector parroquial inválido' }, { status: 400 });
      }
      const sector = await prisma.sectorParroquial.findUnique({
        where: { id_sector_parroquial: sectorId },
        select: { id_parroquia: true }
      });
      if (!sector) {
        return NextResponse.json({ error: 'El sector indicado no existe' }, { status: 400 });
      }
      if (sector.id_parroquia !== context.parishId) {
        return NextResponse.json({ error: 'El sector no pertenece a tu parroquia' }, { status: 403 });
      }
    }

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

    if (!hasPermission(context.session.user.rol, 'canManagePersonas')) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar personas' }, { status: 403 });
    }

    const { id: numeroIdentidad } = await params;

    const personaExistente = await prisma.persona.findUnique({
      where: {
        id_parroquia_numero_identidad: {
          id_parroquia: context.parishId,
          numero_identidad: numeroIdentidad
        }
      },
      include: {
        _count: {
          select: {
            bautismos_bautizado: true,
            bautismos_catequista: true,
            bautismos_madre: true,
            bautismos_madrina: true,
            bautismos_padre: true,
            bautismos_padrino: true,
            confirmaciones_catequista: true,
            confirmaciones_confirmado: true,
            confirmaciones_madre: true,
            confirmaciones_madrina: true,
            confirmaciones_padre: true,
            confirmaciones_padrino: true,
            matrimonios_esposa: true,
            matrimonios_esposo: true,
            matrimonios_madre_esposa: true,
            matrimonios_madre_esposo: true,
            matrimonios_madrina: true,
            matrimonios_padre_esposa: true,
            matrimonios_padre_esposo: true,
            matrimonios_padrino: true,
            comuniones_catequista: true,
            comuniones_madre: true,
            comuniones_padre: true,
            comuniones_persona: true,
            grupos: true
          }
        }
      }
    });

    if (!personaExistente) {
      return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 });
    }

    // No destruir la historia sacramental: si la Persona está referenciada por
    // cualquier sacramento o grupo parroquial, no se permite el borrado físico.
    const referencias = Object.values(personaExistente._count).reduce((a, b) => a + b, 0);
    if (referencias > 0) {
      return NextResponse.json(
        {
          error: 'La persona tiene historial sacramental o de grupos y no puede eliminarse',
          referencias
        },
        { status: 409 }
      );
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
