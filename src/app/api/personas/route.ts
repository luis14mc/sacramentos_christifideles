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

    const personas = await prisma.persona.findMany({
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
      },
      orderBy: [
        { apellidos: 'asc' },
        { nombres: 'asc' }
      ]
    });

    // Convertir BigInt a string para serialización JSON
    const personasSerializadas = personas.map(persona => ({
      ...persona,
      id_sector_parroquial: persona.id_sector_parroquial.toString()
    }));

    return NextResponse.json(personasSerializadas);
  } catch (error) {
    console.error('Error al obtener personas:', error);
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
    console.log('🔍 Datos recibidos completos:', JSON.stringify(data, null, 2));

    // Validar datos obligatorios
    if (!data.numero_identidad || !data.nombres || !data.apellidos) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // Crear la persona
    const nuevaPersona = await prisma.persona.create({
      data: {
        numero_identidad: data.numero_identidad,
        id_parroquia: 3, // Usar ID válido de parroquia (Parroquia Cristo Resucitado)
        id_sector_parroquial: data.sector_id ? BigInt(data.sector_id) : BigInt(1),
        id_orden_religiosa: 1, // ID válido (Diocesano)
        nombres: data.nombres,
        apellidos: data.apellidos,
        fecha_nacimiento: new Date(data.fecha_nacimiento),
        lugar_nacimiento: data.municipio_id || '0801',
        sexo: data.genero === 'Masculino' ? 'M' : 'F',
        telefono: data.telefono || '',
        email: data.email || null,
        direccion: data.direccion || null,
        estado_vital: 1,
        estado_activo_parroquia: 1,
        otra_orden_religiosa: null,
        imagen: null
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

    console.log('✅ Persona creada exitosamente');

    // Serializar BigInt a string para la respuesta
    const personaSerializada = {
      ...nuevaPersona,
      numero_identidad: nuevaPersona.numero_identidad.toString(),
      telefono: nuevaPersona.telefono ? nuevaPersona.telefono.toString() : null,
      id_sector_parroquial: nuevaPersona.id_sector_parroquial ? nuevaPersona.id_sector_parroquial.toString() : null,
      id_orden_religiosa: nuevaPersona.id_orden_religiosa ? nuevaPersona.id_orden_religiosa.toString() : null
    };

    return NextResponse.json(personaSerializada, { status: 201 });
  } catch (error) {
    console.error('❌ Error al crear persona:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
