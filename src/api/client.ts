import axios, { type InternalAxiosRequestConfig } from 'axios';
import { ENV } from '../config/env';
import {
  clearCredentials,
  getCredentials,
  saveTokens,
} from '../services/auth/credentials';
import { normalizeApiError } from './errors';
import type { ApiError, AuthTokens } from './types';
declare module 'axios' {
  interface AxiosRequestConfig {
    sessionAuth?: boolean;
    onboardingToken?: string;
    retried?: boolean;
  }
}
export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});
let onSessionExpired: () => void = () => undefined;
export function registerSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
  return () => {
    if (onSessionExpired === handler) onSessionExpired = () => undefined;
  };
}
let refreshPromise: Promise<void> | null = null;
export function refreshAccessToken() {
  if (!refreshPromise)
    refreshPromise = (async () => {
      const credentials = await getCredentials();
      if (!credentials)
        throw {
          code: 'UNAUTHORIZED',
          status: 401,
          message: 'Please sign in again.',
        } satisfies ApiError;
      const response = await apiClient.post(
        '/api/v1/auth/refresh',
        { refreshToken: credentials.refreshToken },
        { sessionAuth: false },
      );
      if (
        response.data?.success !== true ||
        !response.data.data?.accessToken ||
        !response.data.data?.refreshToken
      )
        throw new Error('Invalid session response.');
      await saveTokens(
        response.data.data as AuthTokens,
        credentials.refreshToken,
      );
    })().finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}
apiClient.interceptors.request.use(async request => {
  console.debug('[API] request', request);
  if (
    request.baseURL !== ENV.API_BASE_URL ||
    !request.url?.startsWith('/') ||
    request.url.startsWith('//') ||
    request.url.includes('\\') ||
    new URL(request.url, ENV.API_BASE_URL).origin !== ENV.API_BASE_URL
  )
    throw {
      code: 'ENVIRONMENT_MISMATCH',
      message: 'The request API origin does not match this application.',
    } satisfies ApiError;
  request.headers.delete('Authorization');
  if (request.onboardingToken)
    request.headers.set('Authorization', `Bearer ${request.onboardingToken}`);
  else if (request.sessionAuth !== false) {
    const credentials = await getCredentials();
    if (credentials)
      request.headers.set('Authorization', `Bearer ${credentials.accessToken}`);
  }
  if (request.data instanceof FormData)
    request.headers.set('Content-Type', 'multipart/form-data');
  request.headers.set('X-RestoFlow-Environment', ENV.APP_ENV);
  if (__DEV__ && ENV.IS_DEVELOPMENT && ENV.ENABLE_API_LOGS)
    console.debug('[API] request', request.method?.toUpperCase());
  return request;
});
function matchesEnvironment(headers: Record<string, unknown>) {
  return headers['x-restoflow-environment'] === ENV.APP_ENV;
}
apiClient.interceptors.response.use(
  response => {
    console.debug('[API] response', response);
    if (!matchesEnvironment(response.headers))
      return Promise.reject({
        code: 'ENVIRONMENT_MISMATCH',
        message: 'The backend environment does not match this application.',
      } satisfies ApiError);
    return response;
  },
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response) {
      if (!matchesEnvironment(error.response.headers))
        throw {
          code: 'ENVIRONMENT_MISMATCH',
          message: 'The backend environment does not match this application.',
        } satisfies ApiError;
      const request = error.config as InternalAxiosRequestConfig | undefined;
      if (
        error.response.status === 401 &&
        request &&
        request.sessionAuth !== false &&
        !request.onboardingToken
      ) {
        const credentials = await getCredentials();
        if (credentials && !request.retried) {
          request.retried = true;
          try {
            // A concurrent request may already have rotated the session.
            if (
              request.headers.get('Authorization') ===
              `Bearer ${credentials.accessToken}`
            )
              await refreshAccessToken();
            return await apiClient.request(request);
          } catch (cause) {
            const failure = normalizeApiError(cause);
            if (failure.status === 401) {
              const latest = await getCredentials();
              if (latest?.refreshToken === credentials.refreshToken) {
                try {
                  await clearCredentials();
                } finally {
                  onSessionExpired();
                }
              }
            }
            throw failure;
          }
        }
        try {
          await clearCredentials();
        } finally {
          onSessionExpired();
        }
      }
    }
    throw normalizeApiError(error);
  },
);
