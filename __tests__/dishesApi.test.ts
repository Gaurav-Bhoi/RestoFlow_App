import type { InternalAxiosRequestConfig } from 'axios';
import { dishApi } from '../src/api/dishes';
import { apiClient } from '../src/api/client';
import { saveTokens } from '../src/services/auth/credentials';
import type { ApiDish, ApiDishInput } from '../src/api/types';
import {
  account,
  DEV_ORIGIN,
  dishId,
  restaurantId,
} from './support/apiFixtures';
import { dishBase } from './support/menuServer';
import {
  validateDishDraft,
  type DishDraft,
} from '../src/features/menu/useDishForm';

const originalAdapter = apiClient.defaults.adapter;
const originalFormData = FormData;
const serverDish: ApiDish = {
  id: dishId,
  name: 'Server dish',
  description: '',
  price: '250.50',
  foodType: 'VEG',
  category: 'Starters',
  available: false,
  imageUrl: '/api/v1/media/restaurants/example/dish.png',
};
const fields: ApiDishInput = {
  name: 'New dish',
  description: '',
  price: '250.50',
  foodType: 'NON_VEG',
  category: 'Main Course',
  available: false,
};
function transport(
  handler: (request: InternalAxiosRequestConfig) => unknown,
  client = apiClient,
) {
  const adapter = jest.fn(async (config: InternalAxiosRequestConfig) => ({
    status: config.method === 'post' ? 201 : 200,
    statusText: 'OK',
    config,
    headers: { 'x-restoflow-environment': 'development' },
    data: { success: true, data: handler(config) },
  }));
  client.defaults.adapter = adapter;
  return adapter;
}
beforeEach(async () => {
  await saveTokens(account);
});
afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  Object.defineProperty(globalThis, 'FormData', {
    value: originalFormData,
    configurable: true,
    writable: true,
  });
});

test('all five dish endpoints use the authenticated restaurant-scoped backend route', async () => {
  const adapter = transport(request =>
    request.method === 'delete'
      ? { id: dishId, deleted: true }
      : request.url === dishBase && request.method === 'get'
      ? [serverDish]
      : serverDish,
  );
  const dishes = await dishApi.list(restaurantId);
  expect(dishes[0]).toMatchObject({
    id: dishId,
    price: 250.5,
    available: false,
    imageUrl: `${DEV_ORIGIN}${serverDish.imageUrl}`,
  });
  await dishApi.get(restaurantId, dishId);
  await dishApi.create(restaurantId, fields);
  await dishApi.update(restaurantId, dishId, { available: true });
  await dishApi.delete(restaurantId, dishId);
  expect(
    adapter.mock.calls.map(([request]) => [request.method, request.url]),
  ).toEqual([
    ['get', dishBase],
    ['get', `${dishBase}/${dishId}`],
    ['post', dishBase],
    ['patch', `${dishBase}/${dishId}`],
    ['delete', `${dishBase}/${dishId}`],
  ]);
  expect(
    adapter.mock.calls.every(
      ([request]) =>
        request.headers.get('Authorization') === 'Bearer access-token',
    ),
  ).toBe(true);
  const created = adapter.mock.calls[2][0];
  expect(created.headers.get('Content-Type')).toBe('multipart/form-data');
  expect(Object.fromEntries(created.data.entries())).toEqual({
    ...fields,
    available: 'false',
  });
  const updated = adapter.mock.calls[3][0];
  expect(Object.fromEntries(updated.data.entries())).toEqual({
    available: 'true',
  });
});

test('menu reads load all pages rather than silently dropping dishes after 100', async () => {
  const adapter = transport(request =>
    request.params.offset === 0
      ? Array.from({ length: 100 }, (_, index) => ({
          ...serverDish,
          id: `dish-${index}`,
        }))
      : [{ ...serverDish, id: 'last-dish' }],
  );
  const dishes = await dishApi.list(restaurantId);
  expect(dishes).toHaveLength(101);
  expect(dishes[100].id).toBe('last-dish');
  expect(adapter.mock.calls.map(([request]) => request.params)).toEqual([
    { limit: 100, offset: 0 },
    { limit: 100, offset: 100 },
  ]);
});

test('native image uploads include URI, MIME type and filename; ordinary edits do not re-upload an image', async () => {
  // Axios captures the global constructor when loaded, as it does on a device.
  const NativeFormData = jest.requireActual(
    'react-native/Libraries/Network/FormData',
  ).default;
  Object.defineProperty(globalThis, 'FormData', {
    value: NativeFormData,
    configurable: true,
    writable: true,
  });
  await jest.isolateModulesAsync(async () => {
    const { dishApi: nativeDishApi } = require('../src/api/dishes');
    const { apiClient: nativeClient } = require('../src/api/client');
    const {
      saveTokens: saveNativeTokens,
    } = require('../src/services/auth/credentials');
    await saveNativeTokens(account);
    const adapter = transport(() => serverDish, nativeClient);
    const image = {
      uri: 'file:///selected-dish.png',
      name: 'dish.png',
      type: 'image/png' as const,
    };
    await nativeDishApi.create(restaurantId, fields, image);
    const parts = adapter.mock.calls[0][0].data.getParts();
    expect(
      parts.find((part: { fieldName: string }) => part.fieldName === 'image'),
    ).toMatchObject({
      ...image,
      headers: {
        'content-type': 'image/png',
        'content-disposition': 'form-data; name="image"; filename="dish.png"',
      },
    });
    expect(
      parts.map((part: { fieldName: string }) => part.fieldName).sort(),
    ).toEqual([
      'available',
      'category',
      'description',
      'foodType',
      'image',
      'name',
      'price',
    ]);
    await nativeDishApi.update(restaurantId, dishId, fields);
    expect(
      adapter.mock.calls[1][0].data
        .getParts()
        .some((part: { fieldName: string }) => part.fieldName === 'image'),
    ).toBe(false);
  });
});

const draft: DishDraft = { ...fields, imageUrl: 'illustration:rice' };
test.each(['0', '0.01', '250.50', '21474836.47'])(
  'client accepts the backend price boundary %s',
  price => {
    expect(validateDishDraft({ ...draft, price }).price).toBeUndefined();
  },
);
test.each(['', '-1', '1.001', '21474836.48', '1e3', '.50', '1.'])(
  'client rejects malformed or out-of-range price %s',
  price => {
    expect(validateDishDraft({ ...draft, price }).price).toBe(
      'menu.validPriceRequired',
    );
  },
);
