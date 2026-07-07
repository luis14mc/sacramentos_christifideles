import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { logger } from '@/lib/logger';
import { safeParseBody } from '@/lib/validation';
import { setupSchema } from '@/lib/validators/schemas';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const validated = safeParseBody(setupSchema, rawBody);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const data = validated.data;

    const setupSecret = process.env.SETUP_SECRET;
    if (setupSecret) {
      const provided =
        request.headers.get('x-setup-secret') ?? data.setupSecret;
      if (provided !== setupSecret) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    }

    const existingParroquia = await prisma.parroquia.findFirst();
    if (existingParroquia) {
      return NextResponse.json(
        { message: 'El sistema ya está configurado' },
        { status: 400 }
      );
    }

    const parroquia = await prisma.parroquia.create({
      data: {
        nombre: data.nombreParroquia,
        ubicacion: data.municipio,
        direccion: data.direccion,
        telefono: data.telefono || '',
        email: data.email || '',
      },
    });

    await prisma.parroquiaConfig.create({
      data: {
        id_parroquia: parroquia.id_parroquia,
        alias_liturgico: `${data.nombreParroquia}`,
        tz: 'America/Tegucigalpa',
        idioma: 'es',
        opciones: {
          tema_color: '#7f1d1d',
          logo_visible: true,
          pie_constancia:
            'En el nombre del Padre, del Hijo y del Espíritu Santo',
        },
      },
    });

    const usuario = await prisma.usuario.create({
      data: {
        id_parroquia: parroquia.id_parroquia,
        id_rol: 1,
        nombre: data.nombreAdmin,
        email: data.emailAdmin,
        contrasena: await hashPassword(data.passwordAdmin),
        telefono: data.telefono || '',
        estado: 1,
        id_usuario_creacion: BigInt(1),
      },
    });

    return NextResponse.json({
      message: 'Instalación completada exitosamente',
      parroquia: {
        id: Number(parroquia.id_parroquia),
        nombre: parroquia.nombre,
      },
      usuario: {
        id: Number(usuario.id_usuario),
        nombre: usuario.nombre,
        email: usuario.email,
      },
    });
  } catch (error) {
    logger.error('Error in setup API', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
