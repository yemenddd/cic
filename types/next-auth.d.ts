import type { DefaultSession } from 'next-auth';

type Role = 'ADMIN' | 'ATTENDEE';

declare module 'next-auth' {
  interface User {
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      /** Unix seconds when the session token was issued (the JWT `iat`). */
      tokenIssuedAt?: number;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
