import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.ENABLE_DEBUG_API !== 'true') {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  return NextResponse.json(
    { error: 'Endpoint deshabilitado.' },
    { status: 410 }
  );
}
