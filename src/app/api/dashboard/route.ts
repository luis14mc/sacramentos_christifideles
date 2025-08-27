import { NextRequest, NextResponse } from 'next/server';
import { getParroquiaData, getDashboardStats } from '@/lib/dashboard';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' }, 
        { status: 400 }
      );
    }

    // Obtener datos de la parroquia y usuario
    const parroquiaData = await getParroquiaData(userId);
    
    if (!parroquiaData) {
      return NextResponse.json(
        { error: 'Usuario o parroquia no encontrada' }, 
        { status: 404 }
      );
    }

    // Obtener estadísticas del dashboard
    const stats = await getDashboardStats(parroquiaData.parroquia.id);

    return NextResponse.json({
      parroquiaData,
      stats
    });

  } catch (error) {
    console.error('Error en API dashboard:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}
