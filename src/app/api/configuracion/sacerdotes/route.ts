import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const sacerdotes = await prisma.ordenSacerdotal.findMany({
      include: {
        rango: {
          select: {
            nombre: true
          }
        },
        orden_religiosa: {
          select: {
            nombre: true
          }
        },
        parroquia: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: [
        { es_parroco: 'desc' },
        { apellidos: 'asc' },
        { nombres: 'asc' }
      ]
    });

    return NextResponse.json(sacerdotes);
  } catch (error) {
    console.error('Error al obtener sacerdotes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await req.json();

    const nuevoSacerdote = await prisma.ordenSacerdotal.create({
      data: {
        numero_identidad: data.numero_identidad,
        nombres: data.nombres,
        apellidos: data.apellidos,
        id_rango_sacerdotal: data.id_rango_sacerdotal,
        id_parroquia: data.id_parroquia,
        id_orden_religiosa: data.id_orden_religiosa,
        fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null,
        lugar_nacimiento: data.lugar_nacimiento,
        telefono: data.telefono,
        email: data.email,
        otra_orden_religiosa: data.otra_orden_religiosa,
        es_parroco: data.es_parroco || 0,
        estado_vital: data.estado_vital || 1,
        imagen: data.imagen
      },
      include: {
        rango: {
          select: {
            nombre: true
          }
        },
        orden_religiosa: {
          select: {
            nombre: true
          }
        }
      }
    });

    return NextResponse.json(nuevoSacerdote, { status: 201 });
  } catch (error) {
    console.error('Error al crear sacerdote:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
