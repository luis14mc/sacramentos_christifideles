import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    if (process.env.ALLOW_INITIAL_SETUP !== 'true') {
      return NextResponse.json({ error: 'Ruta no disponible' }, { status: 404 });
    }

    const existingParroquia = await prisma.parroquia.findFirst();
    const existingUsuario = await prisma.usuario.findFirst();

    if (existingParroquia || existingUsuario) {
      return NextResponse.json(
        { message: 'El sistema ya está configurado' },
        { status: 409 }
      );
    }

    const data = await request.json();
    const requiredFields = [
      'nombreParroquia',
      'municipio',
      'direccion',
      'nombreAdmin',
      'emailAdmin',
      'passwordAdmin'
    ];

    const missing = requiredFields.filter(field => !data?.[field]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios', fields: missing },
        { status: 400 }
      );
    }

    if (String(data.passwordAdmin).length < 12) {
      return NextResponse.json(
        { error: 'La contraseña inicial debe tener al menos 12 caracteres' },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(data.passwordAdmin, 12);

    const result = await prisma.$transaction(async tx => {
      const parroquia = await tx.parroquia.create({
        data: {
          nombre: data.nombreParroquia,
          ubicacion: data.municipio,
          direccion: data.direccion,
          telefono: data.telefono || '',
          email: data.email || ''
        }
      });

      await tx.parroquiaConfig.create({
        data: {
          id_parroquia: parroquia.id_parroquia,
          alias_liturgico: data.nombreParroquia,
          tz: 'America/Tegucigalpa',
          idioma: 'es',
          opciones: {
            tema_color: '#7f1d1d',
            logo_visible: true,
            pie_constancia: 'En el nombre del Padre, del Hijo y del Espíritu Santo'
          }
        }
      });

      const usuario = await tx.usuario.create({
        data: {
          id_parroquia: parroquia.id_parroquia,
          id_rol: 1,
          nombre: data.nombreAdmin,
          email: String(data.emailAdmin).trim().toLowerCase(),
          contrasena: Buffer.from(hashedPassword, 'utf8'),
          telefono: data.telefono || '',
          estado: 1,
          id_usuario_creacion: 1
        }
      });

      return { parroquia, usuario };
    });

    return NextResponse.json({
      message: 'Instalación completada exitosamente',
      parroquia: {
        id: Number(result.parroquia.id_parroquia),
        nombre: result.parroquia.nombre
      },
      usuario: {
        id: Number(result.usuario.id_usuario),
        nombre: result.usuario.nombre,
        email: result.usuario.email
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error in setup API:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
