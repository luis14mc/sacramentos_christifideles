import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware() {
    // Lógica adicional de middleware si es necesaria
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
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
    '/usuarios/:path*'
  ]
};
