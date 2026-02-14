import { Connection } from 'mongoose';
import { IUser } from '@/models/User';
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User extends DefaultUser {
    userData?: Omit<IUser, 'password'>;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      userData?: Omit<IUser, 'password'>;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string;
    userData?: Omit<IUser, 'password'>;
  }
}

declare global {
  var mongoose: {
    conn: Connection | null;
    promise: Promise<Connection> | null;
  };
}

export {};
