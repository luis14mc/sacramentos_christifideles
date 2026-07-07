import { logger } from '@/lib/logger';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';

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
            where: { email: credentials.email },
            include: {
              parroquia: true,
              rol: true,
            },
          });

          if (!user || user.estado !== 1) {
            return null;
          }

          const passwordsMatch = await verifyPassword(
            credentials.password,
            user.contrasena
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
        } catch {
          logger.error('Error during authentication');
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
    async jwt({ token, user }) {
      if (user) {
        token.rol = user.role;
        token.parish = user.parish;
        token.parishId = user.parishId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.rol = token.rol as string;
        session.user.parish = token.parish as string;
        session.user.parishId = token.parishId as string;
      }
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
