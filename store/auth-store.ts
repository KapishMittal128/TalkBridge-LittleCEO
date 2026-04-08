import { useAuth, type Profile } from '@/contexts/AuthContext';

export type { Profile } from '@/contexts/AuthContext';

export interface LocalUser {
  id: string;
  email: string;
}

export interface LocalSession {
  user: LocalUser;
  access_token: string;
}

export function useAuthStore() {
  const { user, profile, isLoading, error, login, register, logout, updateProfile, clearError } = useAuth();

  return {
    session: user
      ? {
          user: {
            id: user,
            email: user,
          },
          access_token: user,
        }
      : null,
    user: user
      ? {
          id: user,
          email: user,
        }
      : null,
    profile: profile as Profile | null,
    isLoading,
    error,
    initialize: async () => {},
    signIn: login,
    signUp: register,
    signOut: logout,
    syncProfile: async () => {},
    updateProfile,
    clearError,
  };
}
