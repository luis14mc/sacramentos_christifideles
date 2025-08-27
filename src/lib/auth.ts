import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcryptjs';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Buscar usuario por email
          const user = await prisma.usuario.findUnique({
            where: {
              email: credentials.email
            },
            include: {
              parroquia: true,
              rol: true
            }
          });

          if (!user) {
            return null;
          }

          // Verificar que el usuario esté activo
          if (user.estado !== 1) {
            return null;
          }

          // Verificar contraseña
          const passwordsMatch = await compare(
            credentials.password,
            Buffer.from(user.contrasena).toString('utf8')
          );

          if (!passwordsMatch) {
            return null;
          }

          // Registrar login en bitácora
          await prisma.bitacoraLogin.create({
            data: {
              id_usuario: user.id_usuario,
              fecha_ingreso: new Date()
            }
          });

          return {
            id: user.id_usuario.toString(),
            email: user.email,
            name: user.nombre,
            role: user.rol.nombre,
            parish: user.parroquia.nombre,
            parishId: user.id_parroquia.toString()
          };
        } catch (error) {
          console.error('Error during authentication:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET
  },
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.parish = user.parish;
        token.parishId = user.parishId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.parish = token.parish;
        session.user.parishId = token.parishId;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Si la URL es relativa, agregar el baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Si la URL ya es del mismo origen, permitirla
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Por defecto, redirigir al dashboard
      return `${baseUrl}/dashboard`;
    }
  }
};

export default authOptions;
