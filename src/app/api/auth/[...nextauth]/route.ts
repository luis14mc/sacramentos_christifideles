import NextAuth from 'next-auth';
import authOptions from '@/lib/auth';
import { checkLoginRateLimit, getClientIp } from '@/lib/rate-limit';

const nextAuthHandler = NextAuth(authOptions);

type AuthContext = { params: Promise<{ nextauth: string[] }> };

async function handler(req: Request, context: AuthContext) {
  if (req.method === 'POST') {
    const ip = getClientIp(req.headers);
    const { allowed, retryAfterMs } = await checkLoginRateLimit(ip);

    if (!allowed) {
      return Response.json(
        { error: 'Demasiados intentos de inicio de sesión. Intente más tarde.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
          },
        }
      );
    }
  }

  return nextAuthHandler(req, context);
}

export { handler as GET, handler as POST };
