import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import {
  serializePersona,
  normalizeSexo,
  isEstadoVitalValido,
  isEstadoActivoValido,
} from '@/lib/persona';

const personaInclude = {
  sector: { select: { nombre: true } },
  orden_religiosa: { select: { nombre: true } },
  municipio_nacimiento: {
    select: {
      nombre_municipio: true,
      departamento: { select: { nombre_departamento: true } },
    },
  },
} as const;

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
          numero_identidad: numeroIdentidad,
        },
      },
      include: personaInclude,
    });

    // Una Persona de otra parroquia se comporta como 404 (no revelar existencia cross-tenant).
    if (!persona) {
      return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 });
    }

    return NextResponse.json(serializePersona(persona));
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

    // El DNI es identidad estable: no se cambia desde un PUT normal.
    if (
      data.numero_identidad !== undefined &&
      String(data.numero_identidad).trim() !== numeroIdentidad
    ) {
      return NextResponse.json(
        { error: 'No se permite cambiar el número de identidad (DNI) desde esta operación' },
        { status: 400 }
      );
    }

    // La parroquia nunca se cambia desde el cliente; siempre proviene de la sesión.
    if (
      data.id_parroquia !== undefined &&
      parseInt(String(data.id_parroquia), 10) !== context.parishId
    ) {
      return NextResponse.json(
        { error: 'No se permite cambiar la parroquia de la persona' },
        { status: 400 }
      );
    }

    // La Persona objetivo debe existir dentro del tenant; si no, 404 (incluye cross-tenant).
    const existente = await prisma.persona.findUnique({
      where: {
        id_parroquia_numero_identidad: {
          id_parroquia: context.parishId,
          numero_identidad: numeroIdentidad,
        },
      },
      select: { numero_identidad: true },
    });
    if (!existente) {
      return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 });
    }

    // Sexo (si se envía): sólo F o M.
    let sexo: 'F' | 'M' | undefined;
    if (data.sexo !== undefined || data.genero !== undefined) {
      const s = normalizeSexo(data.sexo, data.genero);
      if (!s) {
        return NextResponse.json({ error: 'Sexo inválido (debe ser F o M)' }, { status: 400 });
      }
      sexo = s;
    }

    // Estados (si se envían): rangos del SQL v3.
    let estadoVital: number | undefined;
    if (data.estado_vital !== undefined) {
      estadoVital = parseInt(String(data.estado_vital), 10);
      if (Number.isNaN(estadoVital) || !isEstadoVitalValido(estadoVital)) {
        return NextResponse.json({ error: 'estado_vital inválido (0, 1 o 2)' }, { status: 400 });
      }
    }
    let estadoActivo: number | undefined;
    if (data.estado_activo_parroquia !== undefined) {
      estadoActivo = parseInt(String(data.estado_activo_parroquia), 10);
      if (Number.isNaN(estadoActivo) || !isEstadoActivoValido(estadoActivo)) {
        return NextResponse.json(
          { error: 'estado_activo_parroquia inválido (0 o 1)' },
          { status: 400 }
        );
      }
    }

    // Sector (si se reasigna): debe existir y pertenecer a la MISMA parroquia.
    let sectorId: bigint | undefined;
    if (
      data.id_sector_parroquial !== undefined &&
      data.id_sector_parroquial !== null &&
      data.id_sector_parroquial !== ''
    ) {
      try {
        sectorId = BigInt(data.id_sector_parroquial);
      } catch {
        return NextResponse.json({ error: 'Sector parroquial inválido' }, { status: 400 });
      }
      const sector = await prisma.sectorParroquial.findUnique({
        where: { id_sector_parroquial: sectorId },
        select: { id_parroquia: true },
      });
      if (!sector) {
        return NextResponse.json({ error: 'El sector indicado no existe' }, { status: 400 });
      }
      if (sector.id_parroquia !== context.parishId) {
        return NextResponse.json({ error: 'El sector no pertenece a tu parroquia' }, { status: 403 });
      }
    }

    // Orden religiosa (si se envía): debe existir.
    let idOrdenReligiosa: number | undefined;
    if (
      data.id_orden_religiosa !== undefined &&
      data.id_orden_religiosa !== null &&
      data.id_orden_religiosa !== ''
    ) {
      idOrdenReligiosa = parseInt(String(data.id_orden_religiosa), 10);
      if (Number.isNaN(idOrdenReligiosa)) {
        return NextResponse.json({ error: 'Orden religiosa inválida' }, { status: 400 });
      }
      const orden = await prisma.ordenReligiosa.findUnique({
        where: { id_orden_religiosa: idOrdenReligiosa },
        select: { id_orden_religiosa: true },
      });
      if (!orden) {
        return NextResponse.json({ error: 'La orden religiosa indicada no existe' }, { status: 400 });
      }
    }

    // Lugar de nacimiento (si se envía): municipio debe existir.
    let lugarNacimiento: string | undefined;
    if (data.lugar_nacimiento !== undefined && data.lugar_nacimiento !== null && data.lugar_nacimiento !== '') {
      lugarNacimiento = String(data.lugar_nacimiento).trim();
      const municipio = await prisma.municipio.findUnique({
        where: { codigo_municipio: lugarNacimiento },
        select: { codigo_municipio: true },
      });
      if (!municipio) {
        return NextResponse.json({ error: 'El municipio de nacimiento no existe' }, { status: 400 });
      }
    }

    const personaActualizada = await prisma.persona.update({
      where: {
        id_parroquia_numero_identidad: {
          id_parroquia: context.parishId,
          numero_identidad: numeroIdentidad,
        },
      },
      data: {
        nombres: data.nombres,
        apellidos: data.apellidos,
        fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : undefined,
        lugar_nacimiento: lugarNacimiento,
        sexo,
        telefono: data.telefono,
        email: data.email,
        direccion: data.direccion,
        id_sector_parroquial: sectorId,
        id_orden_religiosa: idOrdenReligiosa,
        estado_vital: estadoVital,
        estado_activo_parroquia: estadoActivo,
        otra_orden_religiosa: data.otra_orden_religiosa,
        imagen: data.imagen,
      },
      include: personaInclude,
    });

    return NextResponse.json(serializePersona(personaActualizada));
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
          numero_identidad: numeroIdentidad,
        },
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
            grupos: true,
          },
        },
      },
    });

    // Cross-tenant / inexistente -> 404 (no revelar existencia de otra parroquia).
    if (!personaExistente) {
      return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 });
    }

    // No destruir la historia sacramental: si la Persona está referenciada por
    // cualquier sacramento o grupo parroquial, no se permite el borrado físico.
    const referencias = Object.values(personaExistente._count).reduce((a, b) => a + b, 0);
    if (referencias > 0) {
      return NextResponse.json(
        {
          error: 'La Persona posee registros relacionados y no puede eliminarse.',
          referencias,
        },
        { status: 409 }
      );
    }

    await prisma.persona.delete({
      where: {
        id_parroquia_numero_identidad: {
          id_parroquia: context.parishId,
          numero_identidad: numeroIdentidad,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar persona:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
