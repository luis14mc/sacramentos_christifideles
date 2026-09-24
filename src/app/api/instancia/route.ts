import { NextResponse } from 'next/server';
import { getInstanciaInfo } from '@/lib/instancia';

/** Identidad pública de la instancia (sin auth). Usada por el hub de interoperabilidad. */
export async function GET() {
  try {
    const info = await getInstanciaInfo();
    return NextResponse.json(info, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    console.error('No se pudo obtener la información de la instancia');
    return NextResponse.json(
      { message: 'Instancia no disponible' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
