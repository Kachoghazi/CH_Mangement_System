import { IUser } from '@/models/User';
import axios from 'axios';
import { getSession, signIn, signOut } from 'next-auth/react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface IUserStore {
  user: IUser | null;
  hydrated: boolean;
  status: 'idle' | 'loading' | 'error' | 'unauthenticated' | 'authenticated';
  error: string | null;
  login(email: string, password: string, callbackUrl?: string): Promise<void>;
  createUser(fullName: string, email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

export const useUserStore = create<IUserStore>()(
  immer((set) => ({
    user: null,
    hydrated: false,
    status: 'idle',
    error: null,
    login: async (email, password, callbackUrl = '/') => {
      set(() => ({ status: 'loading' }));
      try {
        const response = await signIn('credentials', {
          email,
          password,
          redirect: false,
          callbackUrl,
        });

        if (response?.error) {
          set(() => ({ status: 'unauthenticated', error: response.error }));
          return;
        }
        const session = await getSession();
        if (session?.user) {
          set(() => ({ user: session.user, status: 'authenticated', error: null }));
        } else {
          set(() => ({ status: 'unauthenticated', error: 'Failed to retrieve user session' }));
        }
      } catch (error) {
        const err = error as Error;
        console.log('Error during login:', err);
        set(() => ({ status: 'error', error: err.message }));
      }
    },
    createUser: async (fullName, email, password) => {
      set(() => ({ status: 'loading', error: null }));
      try {
        const response = await axios.post('/api/auth/register', {
          fullName,
          email,
          password,
        });
        if (response.status !== 201) {
          set(() => ({ status: 'error', error: response.data.message || 'Failed to create user' }));
          return;
        }
        set(() => ({ status: 'idle', error: null }));
        return response.data;
      } catch (error) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        const errorMessage = err.response?.data?.message || err.message || 'Failed to create user';
        set(() => ({ status: 'error', error: errorMessage }));
      }
    },
    logout: async () => {
      try {
        const response = await signOut({ redirect: true, callbackUrl: '/login' });
        if (!response) {
          set(() => ({ status: 'error', error: 'Failed to sign out' }));
        }
        set(() => ({ user: null, status: 'unauthenticated', error: null }));
        return response;
      } catch (error) {
        const err = error as Error;
        set(() => ({ status: 'error', error: err.message }));
      }
    },
  })),
);
