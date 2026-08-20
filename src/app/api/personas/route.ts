import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { hasPermission } from '@/lib/permissions';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.parishId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(session.user.rol, 'canViewPersonas')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const parishId = parseInt(session.user.parishId, 10);

    const personas = await prisma.persona.findMany({
      where: { id_parroquia: parishId },
      include: {
        sector: { select: { nombre: true } },
        orden_religiosa: { select: { nombre: true } },
        municipio_nacimiento: {
          select: {
            nombre_municipio: true,
            departamento: { select: { nombre_departamento: true } }
          }
        }
      },
      orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }]
    });

    return NextResponse.json(personas.map(persona => ({
      ...persona,
      id_sector_parroquial: persona.id_sector_parroquial.toString()
    })));
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

    // --- Identidad y nombres (obligatorios) ---
    const numeroIdentidad = typeof data.numero_identidad === 'string' ? data.numero_identidad.trim() : '';
    const nombres = typeof data.nombres === 'string' ? data.nombres.trim() : '';
    const apellidos = typeof data.apellidos === 'string' ? data.apellidos.trim() : '';
    if (!numeroIdentidad || !nombres || !apellidos) {
      return NextResponse.json({ error: 'Faltan datos obligatorios: número de identidad, nombres y apellidos' }, { status: 400 });
    }

    // --- Fecha de nacimiento (requerida y válida) ---
    const fechaNacimiento = data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null;
    if (!fechaNacimiento || Number.isNaN(fechaNacimiento.getTime())) {
      return NextResponse.json({ error: 'Fecha de nacimiento inválida' }, { status: 400 });
    }

    // --- Sexo (solo F o M) ---
    let sexo: 'F' | 'M';
    if (data.sexo === 'F' || data.sexo === 'M') {
      sexo = data.sexo;
    } else if (data.genero === 'Masculino') {
      sexo = 'M';
    } else if (data.genero === 'Femenino') {
      sexo = 'F';
    } else {
      return NextResponse.json({ error: 'Sexo inválido (debe ser F o M)' }, { status: 400 });
    }

    // --- Teléfono (requerido según SQL v3) ---
    const telefono = typeof data.telefono === 'string' ? data.telefono.trim() : '';
    if (!telefono) {
      return NextResponse.json({ error: 'El teléfono es obligatorio' }, { status: 400 });
    }

    // --- Sector: obligatorio, existente y de la MISMA parroquia (nunca confiar en el id del cliente como autorización) ---
    if (data.sector_id === undefined || data.sector_id === null || data.sector_id === '') {
      return NextResponse.json({ error: 'El sector parroquial es obligatorio' }, { status: 400 });
    }
    let sectorId: bigint;
    try {
      sectorId = BigInt(data.sector_id);
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
    if (sector.id_parroquia !== parishId) {
      return NextResponse.json({ error: 'El sector no pertenece a tu parroquia' }, { status: 403 });
    }

    // --- Orden religiosa: validar existencia (el formulario aún no la captura; se resuelve determinista) ---
    let idOrdenReligiosa: number;
    if (data.id_orden_religiosa !== undefined && data.id_orden_religiosa !== null && data.id_orden_religiosa !== '') {
      const ordenId = Number(data.id_orden_religiosa);
      if (Number.isNaN(ordenId)) {
        return NextResponse.json({ error: 'Orden religiosa inválida' }, { status: 400 });
      }
      const orden = await prisma.ordenReligiosa.findUnique({
        where: { id_orden_religiosa: ordenId },
        select: { id_orden_religiosa: true }
      });
      if (!orden) {
        return NextResponse.json({ error: 'La orden religiosa indicada no existe' }, { status: 400 });
      }
      idOrdenReligiosa = orden.id_orden_religiosa;
    } else {
      const ordenDefault = await prisma.ordenReligiosa.findFirst({
        orderBy: { id_orden_religiosa: 'asc' },
        select: { id_orden_religiosa: true }
      });
      if (!ordenDefault) {
        return NextResponse.json({ error: 'No hay órdenes religiosas configuradas' }, { status: 400 });
      }
      idOrdenReligiosa = ordenDefault.id_orden_religiosa;
    }

    // --- Lugar de nacimiento: municipio requerido y existente ---
    const lugarNacimiento = typeof data.municipio_id === 'string' ? data.municipio_id.trim() : '';
    if (!lugarNacimiento) {
      return NextResponse.json({ error: 'El municipio de nacimiento es obligatorio' }, { status: 400 });
    }
    const municipio = await prisma.municipio.findUnique({
      where: { codigo_municipio: lugarNacimiento },
      select: { codigo_municipio: true }
    });
    if (!municipio) {
      return NextResponse.json({ error: 'El municipio de nacimiento no existe' }, { status: 400 });
    }

    // --- Duplicado de persona dentro de la misma parroquia -> 409 ---
    const existente = await prisma.persona.findUnique({
      where: {
        id_parroquia_numero_identidad: {
          id_parroquia: parishId,
          numero_identidad: numeroIdentidad
        }
      },
      select: { numero_identidad: true }
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
        id_orden_religiosa: idOrdenReligiosa,
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
        imagen: null
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
      ...nuevaPersona,
      numero_identidad: nuevaPersona.numero_identidad.toString(),
      telefono: nuevaPersona.telefono ? nuevaPersona.telefono.toString() : null,
      id_sector_parroquial: nuevaPersona.id_sector_parroquial?.toString() || null,
      id_orden_religiosa: nuevaPersona.id_orden_religiosa?.toString() || null
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear persona:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
