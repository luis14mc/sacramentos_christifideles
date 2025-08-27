import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      rol: string;  // Cambiar a 'rol' para consistencia
      parish: string;
      parishId: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: string;  // En User mantenemos 'role' porque viene de la DB
    parish: string;
    parishId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    rol: string;  // Cambiar a 'rol' para consistencia
    parish: string;
    parishId: string;
  }
}
