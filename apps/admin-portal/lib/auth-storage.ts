import type { AuthTokens } from '@aahar/api-client';

const STORAGE_KEY = 'aahar.admin.auth';

export interface StoredAuth extends AuthTokens {
  savedAt: string;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function readStoredAuth(): StoredAuth | null {
  if (!canUseStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredAuth>;

    if (!parsed.accessToken || !parsed.refreshToken) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      savedAt: parsed.savedAt ?? new Date().toISOString()
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveStoredAuth(tokens: AuthTokens): StoredAuth {
  const storedAuth: StoredAuth = {
    ...tokens,
    savedAt: new Date().toISOString()
  };

  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedAuth));
  }

  return storedAuth;
}

export function clearStoredAuth(): void {
  if (canUseStorage()) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function getStoredAccessToken(): string | null {
  return readStoredAuth()?.accessToken ?? null;
}

export function getStoredRefreshToken(): string | null {
  return readStoredAuth()?.refreshToken ?? null;
}
