import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Temporalmente comentado para permitir login
    // const { pathname } = req.nextUrl;
    // const token = req.nextauth.token;

    // TODO: Reactivar lógica de restricciones después de verificar login
    
    return; // Permitir acceso a todas las rutas por ahora
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
