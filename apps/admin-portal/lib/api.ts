import { ApiClientError, createAuthApi, createOrganizationApi } from '@aahar/api-client';
import {
  clearAaharClientStorage,
  getStoredAccessToken,
  getStoredRefreshToken,
  saveStoredAuth,
} from './auth-storage';

export const apiConfig = {
  authBaseUrl:
    process.env.NEXT_PUBLIC_AUTH_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://localhost:4001/api/v1',
  organizationBaseUrl:
    process.env.NEXT_PUBLIC_ORGANIZATION_API_URL ?? 'http://localhost:4003/api/v1'
};

export const authApi = createAuthApi({
  baseUrl: apiConfig.authBaseUrl
});

let refreshPromise: Promise<string | null> | null = null;
let sessionExpiredHandler: ((message: string) => Promise<void> | void) | null = null;

export function setApiSessionExpiredHandler(
  handler: ((message: string) => Promise<void> | void) | null,
): void {
  sessionExpiredHandler = handler;
}

async function handleUnauthorizedSession(): Promise<void> {
  clearAaharClientStorage();
  await sessionExpiredHandler?.('Your session has expired. Please login again.');
}

export async function refreshStoredSession(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = getStoredRefreshToken();

    if (!refreshToken) {
      return null;
    }

    const response = await authApi.refresh({ refreshToken });

    saveStoredAuth(response.data);

    return response.data.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export const organizationApi = createOrganizationApi({
  baseUrl: apiConfig.organizationBaseUrl,
  getAccessToken: getStoredAccessToken,
  onUnauthorized: handleUnauthorizedSession,
  refreshAccessToken: refreshStoredSession,
});

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    if (error.message.toLowerCase().includes('failed to fetch')) {
      return 'Unable to connect to AAHAR services. Please check your network and try again.';
    }

    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
