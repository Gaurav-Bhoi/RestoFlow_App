import { AxiosError, AxiosHeaders } from 'axios';
import BootSplash from 'react-native-bootsplash';
import { validateEnvironment } from '../src/config/validateEnv';
import { normalizeApiError } from '../src/api/errors';
import { storage } from '../src/services/storage/storage';
import { createAppStore } from '../src/store';
import { signedIn, signedOut } from '../src/store/slices/sessionSlice';
import { hideStartupSplash, initializeApplication } from '../src/app/bootstrap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadRestaurant,
  RESTAURANT_STORAGE_KEY,
} from '../src/services/storage/restaurantStorage';
import { createDemoRestaurant } from '../src/features/restaurant/demoData';
import { apiClient } from '../src/api/client';

const development = {
  APP_ENV: 'development',
  API_BASE_URL: 'http://10.0.2.2:8787',
  ENABLE_API_LOGS: 'true',
  MOCK_API: 'false',
};
test('native environment selects DEV even when JavaScript is a release bundle', () => {
  expect(validateEnvironment(development).APP_ENV).toBe('development');
  expect(
    validateEnvironment({
      ...development,
      APP_ENV: 'production',
      API_BASE_URL: 'https://api.example.test',
      ENABLE_API_LOGS: 'false',
    }).IS_PRODUCTION,
  ).toBe(true);
});
test.each([
  { APP_ENV: 'staging' },
  { APP_ENV: undefined },
  { API_BASE_URL: '' },
  { API_BASE_URL: 'http://api.example.test' },
  { API_BASE_URL: 'https://user:password@api.example.test' },
  { API_BASE_URL: 'https://api.example.test/private?token=x' },
  { APP_ENV: 'production', API_BASE_URL: 'https://api.example.test' },
])('rejects unsafe environment configuration %p', override => {
  expect(() => validateEnvironment({ ...development, ...override })).toThrow();
});
test('mock production placeholder is explicitly allowed and real mode rejects it', () => {
  const config = {
    APP_ENV: 'production',
    API_BASE_URL: '<PRODUCTION_BACKEND_URL>',
    ENABLE_API_LOGS: 'false',
    MOCK_API: 'true',
  };
  expect(validateEnvironment(config).MOCK_API).toBe(true);
  expect(() => validateEnvironment({ ...config, MOCK_API: 'false' })).toThrow();
});
test('Redux initializes signed out and updates only shared session state', () => {
  const store = createAppStore();
  expect(store.getState().session.current).toBeNull();
  const session = {
    role: 'owner' as const,
    phone: '9876543210',
    name: 'Owner',
  };
  store.dispatch(signedIn(session));
  expect(store.getState().session.current).toEqual(session);
  store.dispatch(signedOut());
  expect(store.getState().session.current).toBeNull();
});
test('MMKV wrapper handles typed values, corrupt JSON, removal, and scoped clearing', () => {
  storage.setString('string', 'RestoFlow');
  storage.setBoolean('boolean', false);
  storage.setNumber('number', 0);
  storage.setObject('object', { language: 'en' });
  expect(storage.getString('string')).toBe('RestoFlow');
  expect(storage.getBoolean('boolean')).toBe(false);
  expect(storage.getNumber('number')).toBe(0);
  expect(storage.getObject('object')).toEqual({ language: 'en' });
  expect(storage.getString('missing')).toBeUndefined();
  storage.setString('corrupt', '{broken');
  expect(storage.getObject('corrupt')).toBeUndefined();
  storage.remove('string');
  expect(storage.contains('string')).toBe(false);
  storage.clear();
  expect(storage.contains('object')).toBe(false);
});
test('legacy restaurant data migrates before the AsyncStorage copy is removed', async () => {
  const restaurant = createDemoRestaurant();
  await AsyncStorage.setItem(
    RESTAURANT_STORAGE_KEY,
    JSON.stringify(restaurant),
  );
  expect(await loadRestaurant()).toEqual(restaurant);
  expect(storage.getObject(RESTAURANT_STORAGE_KEY)).toEqual(restaurant);
  expect(await AsyncStorage.getItem(RESTAURANT_STORAGE_KEY)).toBeNull();
});
test.each([400, 401, 403, 404, 409, 422, 429, 500, 503])(
  'normalizes HTTP %s without exposing Axios internals',
  status => {
    const error = new AxiosError(
      'internal details',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      {
        status,
        data: { success: false },
        statusText: '',
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    );
    const result = normalizeApiError(error);
    expect(result.status).toBe(status);
    expect(result.message).not.toBe('internal details');
    expect(result).not.toHaveProperty('config');
  },
);
test.each([
  ['ERR_NETWORK', 'NETWORK_UNAVAILABLE'],
  ['ECONNABORTED', 'TIMEOUT'],
  ['ETIMEDOUT', 'TIMEOUT'],
  ['ERR_CANCELED', 'ERR_CANCELED'],
])('normalizes transport failure %s', (code, normalized) => {
  expect(normalizeApiError(new AxiosError('details', code)).code).toBe(
    normalized,
  );
});
test('failed local bootstrap recovers and readiness can hide the splash', async () => {
  const recover = jest.fn();
  await initializeApplication(async () => {
    throw new Error('corrupt preference');
  }, recover);
  expect(recover).toHaveBeenCalledTimes(1);
  await hideStartupSplash();
  expect(BootSplash.hide).toHaveBeenCalledWith({ fade: true });
});
test('splash transition failures retry without animation', async () => {
  (BootSplash.hide as jest.Mock).mockRejectedValueOnce(
    new Error('transition failed'),
  );
  await hideStartupSplash();
  expect(BootSplash.hide).toHaveBeenLastCalledWith({ fade: false });
});

test('even a failed recovery cannot block application readiness', async () => {
  const fail = async () => {
    throw new Error('restore failed');
  };
  await expect(initializeApplication(fail, fail)).resolves.toBeUndefined();
});

test('mock mode prevents all backend transport calls', async () => {
  const transport = jest.fn();
  await expect(
    apiClient.get('/api/v1/example', { adapter: transport }),
  ).rejects.toMatchObject({ code: 'API_NOT_CONFIGURED' });
  expect(transport).not.toHaveBeenCalled();
});
