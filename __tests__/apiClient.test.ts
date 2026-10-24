import {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';
import { apiClient, registerSessionExpiredHandler } from '../src/api/client';
import { saveTokens, getCredentials } from '../src/services/auth/credentials';
import { account, DEV_ORIGIN, PROD_ORIGIN } from './support/apiFixtures';
const originalAdapter = apiClient.defaults.adapter;
const adapter = jest.fn(async config => ({
  data: { success: true },
  status: 200,
  statusText: 'OK',
  headers: { 'x-restoflow-environment': 'development' },
  config,
}));
afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});
test('uses only the configured Worker and preserves timeout', async () => {
  await apiClient.get('/api/v1/example', { adapter });
  const request = adapter.mock.calls.at(-1)?.[0];
  expect(request.baseURL).toBe(DEV_ORIGIN);
  expect(request.timeout).toBe(15000);
  expect(request.headers.get('X-RestoFlow-Environment')).toBe('development');
});
test('uses securely stored credentials and clears arbitrary authorization', async () => {
  await saveTokens(account);
  await apiClient.get('/api/v1/example', {
    adapter,
    headers: { Authorization: 'arbitrary' },
  });
  expect(adapter.mock.calls.at(-1)?.[0].headers.get('Authorization')).toBe(
    'Bearer access-token',
  );
  await apiClient.get('/api/v1/auth/phone/check', {
    adapter,
    sessionAuth: false,
  });
  expect(adapter.mock.calls.at(-1)?.[0].headers.has('Authorization')).toBe(
    false,
  );
});
test.each([
  `${PROD_ORIGIN}/api`,
  `${DEV_ORIGIN}/api`,
  '//production.example.test/api',
  '/\\production.example.test/api',
  'https://preview-restoflow-backend-dev.gauravbhoiofficial.workers.dev/api',
])('rejects alternate/absolute request %s before sending', async url => {
  const transport = jest.fn();
  await expect(
    apiClient.get(url, { adapter: transport }),
  ).rejects.toMatchObject({ code: 'ENVIRONMENT_MISMATCH' });
  expect(transport).not.toHaveBeenCalled();
});
test('rejects a screen-level baseURL override', async () => {
  await expect(
    apiClient.get('/api', { baseURL: PROD_ORIGIN, adapter }),
  ).rejects.toMatchObject({ code: 'ENVIRONMENT_MISMATCH' });
});
test('rejects wrong or missing backend environment headers', async () => {
  for (const headers of [{}, { 'x-restoflow-environment': 'production' }])
    await expect(
      apiClient.get('/api', {
        adapter: async config => ({
          data: {},
          status: 200,
          statusText: '',
          config,
          headers,
        }),
      }),
    ).rejects.toMatchObject({ code: 'ENVIRONMENT_MISMATCH' });
});
function unauthorized(config: InternalAxiosRequestConfig) {
  return new AxiosError('unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
    status: 401,
    statusText: '',
    data: {
      success: false,
      error: { code: 'INVALID_ACCESS_TOKEN', message: 'Expired' },
    },
    headers: { 'x-restoflow-environment': 'development' },
    config,
  });
}
test('concurrent 401s share one refresh and retry with rotated credentials', async () => {
  await saveTokens(account);
  const transport = jest.fn(async (config: InternalAxiosRequestConfig) => {
    if (config.url === '/api/v1/auth/refresh')
      return {
        data: {
          success: true,
          data: {
            ...account,
            accessToken: 'next-access',
            refreshToken: 'next-refresh',
          },
        },
        status: 200,
        statusText: '',
        config,
        headers: { 'x-restoflow-environment': 'development' },
      };
    if (config.headers.get('Authorization') === 'Bearer access-token')
      throw unauthorized(config);
    return {
      data: { success: true, data: {} },
      status: 200,
      statusText: '',
      config,
      headers: { 'x-restoflow-environment': 'development' },
    };
  });
  apiClient.defaults.adapter = transport;
  await Promise.all([apiClient.get('/api/v1/a'), apiClient.get('/api/v1/b')]);
  expect(
    transport.mock.calls.filter(
      ([config]) => config.url === '/api/v1/auth/refresh',
    ),
  ).toHaveLength(1);
  expect((await getCredentials())?.refreshToken).toBe('next-refresh');
});
test('rejected refresh clears credentials and ends the session without a retry loop', async () => {
  await saveTokens(account);
  const expired = jest.fn();
  const unregister = registerSessionExpiredHandler(expired);
  const transport = jest.fn(async (config: InternalAxiosRequestConfig) => {
    throw unauthorized(config);
  });
  apiClient.defaults.adapter = transport;
  await expect(apiClient.get('/api/v1/a')).rejects.toMatchObject({
    status: 401,
  });
  expect(transport).toHaveBeenCalledTimes(2);
  expect(await getCredentials()).toBeNull();
  expect(expired).toHaveBeenCalledTimes(1);
  unregister();
});
test('public password login failures never attempt token refresh or clear an existing session', async () => {
  await saveTokens(account);
  const transport = jest.fn(async (config: InternalAxiosRequestConfig) => {
    throw unauthorized(config);
  });
  await expect(
    apiClient.post(
      '/api/v1/auth/login',
      { phoneNumber: '+919876543210', password: 'incorrect-password' },
      { sessionAuth: false, adapter: transport },
    ),
  ).rejects.toMatchObject({ status: 401 });
  expect(transport).toHaveBeenCalledTimes(1);
  expect((await getCredentials())?.refreshToken).toBe(account.refreshToken);
});
test('network failures retain credentials for retry', async () => {
  await saveTokens(account);
  const transport = jest.fn(async (config: InternalAxiosRequestConfig) => {
    throw new AxiosError('network', 'ERR_NETWORK', config);
  });
  await expect(
    apiClient.get('/api/v1/a', { adapter: transport }),
  ).rejects.toMatchObject({ code: 'NETWORK_UNAVAILABLE' });
  expect((await getCredentials())?.refreshToken).toBe(account.refreshToken);
});
test('uses AbortController cancellation', async () => {
  const controller = new AbortController();
  controller.abort();
  const transport = jest.fn();
  await expect(
    apiClient.get('/api', {
      signal: controller.signal,
      adapter: transport,
      headers: new AxiosHeaders(),
    }),
  ).rejects.toMatchObject({ code: 'ERR_CANCELED' });
  expect(transport).not.toHaveBeenCalled();
});
