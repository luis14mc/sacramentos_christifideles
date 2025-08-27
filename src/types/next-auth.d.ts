import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      parish: string;
      parishId: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: string;
    parish: string;
    parishId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    parish: string;
    parishId: string;
  }
}
