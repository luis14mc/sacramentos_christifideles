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

    const roles = await prisma.rolParroquial.findMany({
      include: {
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

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error al obtener roles parroquiales:', error);
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

    const nuevoRol = await prisma.rolParroquial.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion
      },
      include: {
        _count: {
          select: {
            miembros: true
          }
        }
      }
    });

    return NextResponse.json(nuevoRol, { status: 201 });
  } catch (error) {
    console.error('Error al crear rol parroquial:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
