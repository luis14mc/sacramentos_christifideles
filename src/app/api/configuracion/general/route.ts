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

    // Obtener información de la parroquia
    const parroquia = await prisma.parroquia.findFirst({
      include: {
        config: true,
        municipio: {
          include: {
            departamento: true
          }
        }
      }
    });

    if (!parroquia) {
      return NextResponse.json(
        { error: 'No se encontró configuración de parroquia' },
        { status: 404 }
      );
    }

    return NextResponse.json(parroquia);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
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
      parroquia: parroquiaData,
      configuracion: configData 
    } = body;

    // Actualizar datos de la parroquia
    await prisma.parroquia.update({
      where: { id_parroquia: parroquiaData.id_parroquia },
      data: {
        nombre: parroquiaData.nombre,
        direccion: parroquiaData.direccion,
        telefono: parroquiaData.telefono,
        email: parroquiaData.email,
        ubicacion: parroquiaData.ubicacion
      }
    });

    // Actualizar o crear configuración
    if (configData) {
      await prisma.parroquiaConfig.upsert({
        where: { id_parroquia: parroquiaData.id_parroquia },
        update: {
          alias_liturgico: configData.alias_liturgico,
          logo_url: configData.logo_url,
          sello_digital_url: configData.sello_digital_url,
          tz: configData.tz,
          idioma: configData.idioma,
          opciones: configData.opciones
        },
        create: {
          id_parroquia: parroquiaData.id_parroquia,
          alias_liturgico: configData.alias_liturgico,
          logo_url: configData.logo_url,
          sello_digital_url: configData.sello_digital_url,
          tz: configData.tz || 'America/Tegucigalpa',
          idioma: configData.idioma || 'es',
          opciones: configData.opciones || {}
        }
      });
    }

    // Obtener la configuración actualizada completa
    const resultado = await prisma.parroquia.findUnique({
      where: { id_parroquia: parroquiaData.id_parroquia },
      include: {
        config: true,
        municipio: {
          include: {
            departamento: true
          }
        }
      }
    });

    console.log('Configuración guardada y devuelta:', JSON.stringify(resultado, null, 2));

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}