import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token && !token.sessionRevoked,
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/personas/:path*',
    '/bautismos/:path*',
    '/primeras-comuniones/:path*',
    '/confirmaciones/:path*',
    '/matrimonios/:path*',
    '/constancias/:path*',
    '/reportes/:path*',
    '/configuracion/:path*',
    '/usuarios/:path*',
    '/sacerdotes/:path*',
    '/auditoria/:path*',
    '/buscar/:path*',
    '/libros/:path*',
    '/consultas/:path*',
  ],
};
