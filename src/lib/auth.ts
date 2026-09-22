import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

async function loadSessionUser(userId: string) {
  let id: bigint;
  try {
    id = BigInt(userId);
  } catch {
    return null;
  }

  const user = await prisma.usuario.findUnique({
    where: { id_usuario: id },
    include: { parroquia: true, rol: true },
  });

  if (!user || user.estado !== 1) {
    return null;
  }

  return {
    id: user.id_usuario.toString(),
    email: user.email,
    name: user.nombre,
    role: user.rol.nombre.toLowerCase(),
    parish: user.parroquia.nombre,
    parishId: user.id_parroquia.toString(),
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.usuario.findUnique({
            where: {
              email: credentials.email,
            },
            include: {
              parroquia: true,
              rol: true,
            },
          });

          if (!user) {
            return null;
          }

          if (user.estado !== 1) {
            return null;
          }

          const passwordsMatch = await compare(
            credentials.password,
            Buffer.from(user.contrasena).toString('utf8')
          );

          if (!passwordsMatch) {
            return null;
          }

          await prisma.bitacoraLogin.create({
            data: {
              id_usuario: user.id_usuario,
              fecha_ingreso: new Date(),
            },
          });

          return {
            id: user.id_usuario.toString(),
            email: user.email,
            name: user.nombre,
            role: user.rol.nombre.toLowerCase(),
            parish: user.parroquia.nombre,
            parishId: user.id_parroquia.toString(),
          };
        } catch (error) {
          console.error('Error during authentication:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.rol = user.role;
        token.parish = user.parish;
        token.parishId = user.parishId;
        token.sessionRevoked = false;
        token.lastVerifiedAt = Date.now();
        return token;
      }

      if (!token.sub) {
        return token;
      }

      // Revalidar contra BD como máximo cada REVALIDATE_INTERVAL_MS, o siempre que
      // la sesión se actualice explícitamente (trigger 'update'). Equilibra
      // revocación oportuna con carga de base de datos por request.
      const REVALIDATE_INTERVAL_MS = 60_000;
      const last = typeof token.lastVerifiedAt === 'number' ? token.lastVerifiedAt : 0;
      const stale = Date.now() - last > REVALIDATE_INTERVAL_MS;
      if (!stale && trigger !== 'update' && !token.sessionRevoked) {
        return token;
      }

      const fresh = await loadSessionUser(token.sub);
      if (!fresh) {
        token.sessionRevoked = true;
        token.rol = '';
        token.parish = '';
        token.parishId = '';
        return token;
      }

      token.sessionRevoked = false;
      token.rol = fresh.role;
      token.parish = fresh.parish;
      token.parishId = fresh.parishId;
      token.lastVerifiedAt = Date.now();
      return token;
    },
    async session({ session, token }) {
      if (token.sessionRevoked || !token.sub || !token.parishId) {
        return {
          ...session,
          user: undefined,
          expires: new Date(0).toISOString(),
        };
      }

      session.user.id = token.sub;
      session.user.rol = token.rol;
      session.user.parish = token.parish;
      session.user.parishId = token.parishId;
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return `${baseUrl}/`;
    },
  },
};

export default authOptions;
