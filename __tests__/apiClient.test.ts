import { AxiosError, AxiosHeaders } from 'axios';
import { apiClient } from '../src/api/client';
import { registerAccessTokenReader } from '../src/services/auth/credentials';

jest.mock('../src/config/env', () => ({
  ENV: {
    APP_ENV: 'development',
    API_BASE_URL: 'http://10.0.2.2:8787',
    MOCK_API: false,
    ENABLE_API_LOGS: false,
    IS_DEVELOPMENT: true,
  },
}));

beforeEach(() => registerAccessTokenReader(() => null));
const adapter = jest.fn(async config => ({
  data: { success: true },
  status: 200,
  statusText: 'OK',
  headers: { 'x-restoflow-environment': 'development' },
  config,
}));
test('uses the native API origin and configured timeout', async () => {
  await apiClient.get('/api/v1/example', { adapter });
  const request = adapter.mock.calls.at(-1)?.[0];
  expect(request.baseURL).toBe('http://10.0.2.2:8787');
  expect(request.timeout).toBe(15000);
  expect(request.headers.get('X-RestoFlow-Environment')).toBe('development');
});
test('reads credentials centrally; absent token removes arbitrary authorization', async () => {
  registerAccessTokenReader(() => 'test-token');
  await apiClient.get('/api/v1/example', { adapter });
  expect(adapter.mock.calls.at(-1)?.[0].headers.get('Authorization')).toBe(
    'Bearer test-token',
  );
  registerAccessTokenReader(() => null);
  await apiClient.get('/api/v1/example', {
    adapter,
    headers: { Authorization: 'arbitrary' },
  });
  expect(adapter.mock.calls.at(-1)?.[0].headers.has('Authorization')).toBe(
    false,
  );
});
test.each([
  'https://production.example.test/api',
  '//production.example.test/api',
  '/\\production.example.test/api',
])('rejects cross-origin request %s before sending', async url => {
  const transport = jest.fn();
  await expect(
    apiClient.get(url, { adapter: transport }),
  ).rejects.toMatchObject({ code: 'ENVIRONMENT_MISMATCH' });
  expect(transport).not.toHaveBeenCalled();
});
test('rejects a screen-level baseURL override', async () => {
  await expect(
    apiClient.get('/api', {
      baseURL: 'https://production.example.test',
      adapter,
    }),
  ).rejects.toMatchObject({ code: 'ENVIRONMENT_MISMATCH' });
});
test('rejects wrong or missing backend environment headers', async () => {
  for (const headers of [{}, { 'x-restoflow-environment': 'production' }]) {
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
  }
});
test('backend 401 returns once without inventing refresh endpoints or retry loops', async () => {
  const transport = jest.fn(async config => {
    throw new AxiosError('unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
      status: 401,
      statusText: '',
      data: {},
      headers: { 'x-restoflow-environment': 'development' },
      config,
    });
  });
  await expect(
    apiClient.get('/api', { adapter: transport }),
  ).rejects.toMatchObject({ status: 401 });
  expect(transport).toHaveBeenCalledTimes(1);
});
test('uses modern AbortController cancellation', async () => {
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
