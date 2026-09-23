import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: 'ok', database: 'ok' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    // Evita filtrar detalles internos (stack traces, DSN, mensajes del driver)
    // en logs del healthcheck. Railway solo necesita saber que el servicio
    // está degraded y reiniciar.
    console.error('Healthcheck database unreachable');
    return NextResponse.json(
      { status: 'degraded', database: 'unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
