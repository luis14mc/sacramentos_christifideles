import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith('/api/')) {
      if (!token) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        if (pathname.startsWith('/api/auth')) {
          return true;
        }

        if (pathname === '/api/setup') {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/personas/:path*',
    '/bautismos/:path*',
    '/primera-comunion/:path*',
    '/confirmaciones/:path*',
    '/matrimonios/:path*',
    '/constancias/:path*',
    '/reportes/:path*',
    '/configuracion/:path*',
    '/usuarios/:path*',
    '/api/((?!auth).*)',
  ],
};
