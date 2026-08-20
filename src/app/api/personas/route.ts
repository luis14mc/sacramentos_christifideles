import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { serializePersona, normalizeSexo } from '@/lib/persona';

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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.parishId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(session.user.rol, 'canViewPersonas')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const parishId = parseInt(session.user.parishId, 10);
    if (Number.isNaN(parishId)) {
      return NextResponse.json({ error: 'Parroquia de sesión inválida' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const requestedLimit = parseInt(searchParams.get('limit') || '0', 10);
    const limit = requestedLimit > 0 ? Math.min(requestedLimit, 50) : undefined;
    const lite = searchParams.get('lite') === '1';

    const where = {
      id_parroquia: parishId,
      ...(q
        ? {
            OR: [
              { numero_identidad: { contains: q, mode: 'insensitive' as const } },
              { nombres: { contains: q, mode: 'insensitive' as const } },
              { apellidos: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    if (lite) {
      const personas = await prisma.persona.findMany({
        where,
        select: { numero_identidad: true, nombres: true, apellidos: true },
        orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
        ...(limit ? { take: limit } : {}),
      });
      return NextResponse.json(personas);
    }

    const personas = await prisma.persona.findMany({
      where,
      include: personaInclude,
      orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
      ...(limit ? { take: limit } : {}),
    });

    return NextResponse.json(personas.map(serializePersona));
  } catch (error) {
    console.error('Error al obtener personas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.parishId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(session.user.rol, 'canManagePersonas')) {
      return NextResponse.json({ error: 'No tienes permiso para crear personas' }, { status: 403 });
    }

    const parishId = parseInt(session.user.parishId, 10);
    if (Number.isNaN(parishId)) {
      return NextResponse.json({ error: 'Parroquia de sesión inválida' }, { status: 400 });
    }

    const data = await req.json();

    const numeroIdentidad = typeof data.numero_identidad === 'string' ? data.numero_identidad.trim() : '';
    const nombres = typeof data.nombres === 'string' ? data.nombres.trim() : '';
    const apellidos = typeof data.apellidos === 'string' ? data.apellidos.trim() : '';
    if (!numeroIdentidad || !nombres || !apellidos) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios: número de identidad, nombres y apellidos' },
        { status: 400 }
      );
    }

    const fechaNacimiento = data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null;
    if (!fechaNacimiento || Number.isNaN(fechaNacimiento.getTime())) {
      return NextResponse.json({ error: 'Fecha de nacimiento inválida' }, { status: 400 });
    }

    const sexo = normalizeSexo(data.sexo, data.genero);
    if (!sexo) {
      return NextResponse.json({ error: 'Sexo inválido (debe ser F o M)' }, { status: 400 });
    }

    const telefono = typeof data.telefono === 'string' ? data.telefono.trim() : '';
    if (!telefono) {
      return NextResponse.json({ error: 'El teléfono es obligatorio' }, { status: 400 });
    }

    const sectorRaw = data.id_sector_parroquial ?? data.sector_id;
    if (sectorRaw === undefined || sectorRaw === null || sectorRaw === '') {
      return NextResponse.json({ error: 'El sector parroquial es obligatorio' }, { status: 400 });
    }
    let sectorId: bigint;
    try {
      sectorId = BigInt(sectorRaw);
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
    if (sector.id_parroquia !== parishId) {
      return NextResponse.json({ error: 'El sector no pertenece a tu parroquia' }, { status: 403 });
    }

    if (
      data.id_orden_religiosa === undefined ||
      data.id_orden_religiosa === null ||
      data.id_orden_religiosa === ''
    ) {
      return NextResponse.json({ error: 'La orden religiosa es obligatoria' }, { status: 400 });
    }
    const idOrdenReligiosa = Number(data.id_orden_religiosa);
    if (!Number.isInteger(idOrdenReligiosa)) {
      return NextResponse.json({ error: 'Orden religiosa inválida' }, { status: 400 });
    }
    const orden = await prisma.ordenReligiosa.findUnique({
      where: { id_orden_religiosa: idOrdenReligiosa },
      select: { id_orden_religiosa: true },
    });
    if (!orden) {
      return NextResponse.json({ error: 'La orden religiosa indicada no existe' }, { status: 400 });
    }

    const lugarRaw = data.lugar_nacimiento ?? data.municipio_id;
    const lugarNacimiento = typeof lugarRaw === 'string' ? lugarRaw.trim() : '';
    if (!lugarNacimiento) {
      return NextResponse.json({ error: 'El municipio de nacimiento es obligatorio' }, { status: 400 });
    }
    const municipio = await prisma.municipio.findUnique({
      where: { codigo_municipio: lugarNacimiento },
      select: { codigo_municipio: true },
    });
    if (!municipio) {
      return NextResponse.json({ error: 'El municipio de nacimiento no existe' }, { status: 400 });
    }

    const existente = await prisma.persona.findUnique({
      where: {
        id_parroquia_numero_identidad: {
          id_parroquia: parishId,
          numero_identidad: numeroIdentidad,
        },
      },
      select: { numero_identidad: true },
    });
    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe una persona con ese número de identidad en esta parroquia' },
        { status: 409 }
      );
    }

    const nuevaPersona = await prisma.persona.create({
      data: {
        numero_identidad: numeroIdentidad,
        id_parroquia: parishId,
        id_sector_parroquial: sectorId,
        id_orden_religiosa: orden.id_orden_religiosa,
        nombres,
        apellidos,
        fecha_nacimiento: fechaNacimiento,
        lugar_nacimiento: lugarNacimiento,
        sexo,
        telefono,
        email: data.email ? String(data.email).trim() : null,
        direccion: data.direccion ? String(data.direccion).trim() : null,
        estado_vital: 1,
        estado_activo_parroquia: 1,
        otra_orden_religiosa: null,
        imagen: null,
      },
      include: personaInclude,
    });

    return NextResponse.json(serializePersona(nuevaPersona), { status: 201 });
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe una persona con ese número de identidad en esta parroquia' },
        { status: 409 }
      );
    }
    console.error('Error al crear persona:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
