import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id_usuario: true,
        nombre: true,
        email: true,
        estado: true,
        rol: {
          select: {
            id_rol: true,
            nombre: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // Convertir BigInt a string para serialización
    const usuariosSerializables = usuarios.map(usuario => ({
      ...usuario,
      id_usuario: usuario.id_usuario.toString(),
      rol: {
        ...usuario.rol,
        id_rol: usuario.rol.id_rol.toString()
      }
    }));

    return NextResponse.json({
      success: true,
      usuarios: usuariosSerializables
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener usuarios'
    }, { status: 500 });
  }
}
