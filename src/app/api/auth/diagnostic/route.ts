import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const configuredUrl = process.env.NEXTAUTH_URL?.trim() || '';
  const secret = process.env.NEXTAUTH_SECRET || '';

  let configuredOrigin: string | null = null;
  try {
    configuredOrigin = configuredUrl ? new URL(configuredUrl).origin : null;
  } catch {
    configuredOrigin = null;
  }

  const requestOrigin = request.nextUrl.origin;

  return NextResponse.json(
    {
      nextAuthUrlConfigured: Boolean(configuredUrl),
      configuredOrigin,
      requestOrigin,
      urlMatchesRequest: Boolean(configuredOrigin) && configuredOrigin === requestOrigin,
      secretConfigured: secret.length > 0,
      secretLengthOk: secret.length >= 32,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
