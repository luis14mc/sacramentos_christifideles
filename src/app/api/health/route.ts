import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: 'ok', database: 'ok' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Healthcheck database error:', error);
    return NextResponse.json(
      { status: 'degraded', database: 'unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
