import { ApiClientError, createAuthApi, createOrganizationApi } from '@aahar/api-client';
import { getStoredAccessToken } from './auth-storage';

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

export const organizationApi = createOrganizationApi({
  baseUrl: apiConfig.organizationBaseUrl,
  getAccessToken: getStoredAccessToken
});

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
