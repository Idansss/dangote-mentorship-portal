import type { RoleName } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      roles: RoleName[];
      locale: string;
    } & DefaultSession['user'];
  }

  interface User {
    roles?: RoleName[];
    locale?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    roles?: RoleName[];
    locale?: string;
  }
}
