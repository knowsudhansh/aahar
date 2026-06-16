'use client';

import type { AuthTokens } from '@aahar/api-client';
import {
  clearStoredAuth,
  getStoredRefreshToken,
  readStoredAuth,
  saveStoredAuth,
  type StoredAuth
} from '@/lib/auth-storage';
import { authApi } from '@/lib/api';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

interface AuthContextValue {
  accessToken: string | null;
  isReady: boolean;
  logout: () => Promise<void>;
  refreshToken: string | null;
  signIn: (tokens: AuthTokens) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setAuth(readStoredAuth());
    setIsReady(true);
  }, []);

  const signIn = useCallback((tokens: AuthTokens) => {
    setAuth(saveStoredAuth(tokens));
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = auth?.refreshToken ?? getStoredRefreshToken();

    clearStoredAuth();
    setAuth(null);

    if (refreshToken) {
      await authApi.logout({ refreshToken }).catch(() => undefined);
    }
  }, [auth?.refreshToken]);

  const contextValue = useMemo(
    () => ({
      accessToken: auth?.accessToken ?? null,
      isReady,
      logout,
      refreshToken: auth?.refreshToken ?? null,
      signIn
    }),
    [auth?.accessToken, auth?.refreshToken, isReady, logout, signIn],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
