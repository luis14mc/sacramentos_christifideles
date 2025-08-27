import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Verificar si ya hay una parroquia configurada
    const existingParroquia = await prisma.parroquia.findFirst();
    if (existingParroquia) {
      return NextResponse.json(
        { message: 'El sistema ya está configurado' },
        { status: 400 }
      );
    }
    
    // Crear la parroquia
    const parroquia = await prisma.parroquia.create({
      data: {
        nombre: data.nombreParroquia,
        ubicacion: data.municipio,
        direccion: data.direccion,
        telefono: data.telefono || '',
        email: data.email || ''
      }
    });
    
    // Crear configuración de la parroquia
    await prisma.parroquiaConfig.create({
      data: {
        id_parroquia: parroquia.id_parroquia,
        alias_liturgico: `${data.nombreParroquia}`,
        tz: 'America/Tegucigalpa',
        idioma: 'es',
        opciones: {
          tema_color: '#7f1d1d',
          logo_visible: true,
          pie_constancia: 'En el nombre del Padre, del Hijo y del Espíritu Santo'
        }
      }
    });
    
    // Crear usuario administrador
    const hashedPassword = await hash(data.passwordAdmin, 10);
    
    const usuario = await prisma.usuario.create({
      data: {
        id_parroquia: parroquia.id_parroquia,
        id_rol: 1, // Super Admin
        nombre: data.nombreAdmin,
        email: data.emailAdmin,
        contrasena: Buffer.from(hashedPassword, 'utf8'),
        telefono: data.telefono || '',
        estado: 1,
        id_usuario_creacion: 1
      }
    });
    
    return NextResponse.json({
      message: 'Instalación completada exitosamente',
      parroquia: {
        id: Number(parroquia.id_parroquia),
        nombre: parroquia.nombre
      },
      usuario: {
        id: Number(usuario.id_usuario),
        nombre: usuario.nombre,
        email: usuario.email
      }
    });
    
  } catch (error) {
    console.error('Error in setup API:', error);
    return NextResponse.json(
      { 
        message: 'Error interno del servidor', 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    );
  }
}
