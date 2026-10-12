import axios from 'axios';
import { ENV } from '../config/env';
import { getAccessToken } from '../services/auth/credentials';
import { normalizeApiError } from './errors';
import type { ApiError } from './types';

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async request => {
  if (ENV.MOCK_API) {
    throw {
      code: 'API_NOT_CONFIGURED',
      message: 'Backend requests are disabled in mock mode.',
    } satisfies ApiError;
  }
  // A screen cannot override the native API origin or send credentials elsewhere.
  if (
    request.baseURL !== ENV.API_BASE_URL ||
    !request.url?.startsWith('/') ||
    request.url.startsWith('//') ||
    request.url.includes('\\') ||
    new URL(request.url, ENV.API_BASE_URL).origin !== ENV.API_BASE_URL
  ) {
    throw {
      code: 'ENVIRONMENT_MISMATCH',
      message: 'The request API origin does not match this application.',
    } satisfies ApiError;
  }
  const token = await getAccessToken();
  request.headers.delete('Authorization');
  if (token) request.headers.set('Authorization', `Bearer ${token}`);
  request.headers.set('X-RestoFlow-Environment', ENV.APP_ENV);
  if (__DEV__ && ENV.IS_DEVELOPMENT && ENV.ENABLE_API_LOGS) {
    // Never log URLs/query parameters, bodies, headers, tokens, or personal data.
    console.debug('[API] request', request.method?.toUpperCase());
  }
  return request;
});

apiClient.interceptors.response.use(
  response => {
    if (response.headers['x-restoflow-environment'] !== ENV.APP_ENV) {
      return Promise.reject({
        code: 'ENVIRONMENT_MISMATCH',
        message: 'The backend environment does not match this application.',
      } satisfies ApiError);
    }
    return response;
  },
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response &&
      error.response.headers['x-restoflow-environment'] !== ENV.APP_ENV
    ) {
      return Promise.reject({
        code: 'ENVIRONMENT_MISMATCH',
        message: 'The backend environment does not match this application.',
      } satisfies ApiError);
    }
    return Promise.reject(normalizeApiError(error));
  },
);
