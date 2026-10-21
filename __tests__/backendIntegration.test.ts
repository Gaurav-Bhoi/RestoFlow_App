jest.mock('../src/config/auth', () => ({ USE_MOCK_OTP: false }));
import { apiClient } from '../src/api/client';
import {
  authApi,
  fetchRestaurant,
  listPages,
  profileSession,
  restaurantApi,
} from '../src/api/restoflow';
import {
  account,
  bill,
  dishId,
  restaurantId,
  subscription,
  tableId,
} from './support/apiFixtures';
import type { InternalAxiosRequestConfig } from 'axios';
import { saveTokens } from '../src/services/auth/credentials';
const originalAdapter = apiClient.defaults.adapter;
afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});
function transport(handler: (request: InternalAxiosRequestConfig) => unknown) {
  const adapter = jest.fn(async (config: InternalAxiosRequestConfig) => ({
    data: { success: true, data: handler(config) },
    status: 200,
    statusText: '',
    headers: { 'x-restoflow-environment': 'development' },
    config,
  }));
  apiClient.defaults.adapter = adapter;
  return adapter;
}
test('pagination continues past 100 records and keeps the route restaurant-scoped', async () => {
  const adapter = transport(config =>
    config.params.offset === 0
      ? Array.from({ length: 100 }, (_, id) => ({ id }))
      : [{ id: 100 }],
  );
  expect(
    await listPages(`/api/v1/restaurants/${restaurantId}/tables`),
  ).toHaveLength(101);
  expect(adapter.mock.calls.map(([config]) => config.params.offset)).toEqual([
    0, 100,
  ]);
  expect(
    adapter.mock.calls.every(
      ([config]) => config.url === `/api/v1/restaurants/${restaurantId}/tables`,
    ),
  ).toBe(true);
});
test('expired subscriptions are read without calling blocked operational routes', async () => {
  const adapter = transport(() => ({
    ...subscription,
    isActive: false,
    state: 'FREE_TRIAL_EXPIRED',
  }));
  const restaurant = await fetchRestaurant(profileSession(account));
  expect(restaurant.subscription.isActive).toBe(false);
  expect(adapter).toHaveBeenCalledTimes(1);
  expect(adapter.mock.calls[0][0].url).toBe(
    `/api/v1/restaurants/${restaurantId}/subscription`,
  );
  expect(restaurant.menu).toEqual([]);
});
test('waiter restaurant refresh does not call the owner-only staff API', async () => {
  const adapter = transport(config => {
    if (config.url?.endsWith('/subscription')) return subscription;
    if (config.url?.endsWith(restaurantId))
      return { name: 'Server Restaurant', owner: account.user };
    if (config.url?.endsWith('/dashboard'))
      return {
        totalTables: 1,
        occupiedTables: 1,
        guestCount: 1,
        openOrderTotal: '300.00',
        availableTables: 0,
        currency: 'INR',
      };
    if (config.url?.endsWith('/tables'))
      return [
        { id: tableId, tableNumber: 7, occupied: true, openOrderCount: 1 },
      ];
    if (config.url?.endsWith('/menu/dishes'))
      return [
        {
          id: dishId,
          name: 'Server Dish',
          description: null,
          category: 'Seasonal',
          foodType: 'NON_VEG',
          available: true,
          price: '250.50',
          imageUrl: null,
        },
      ];
    if (config.url?.endsWith('/orders'))
      return [
        {
          id: bill.orderId,
          tableId,
          customerName: 'Customer',
          itemCount: 2,
          total: '300.00',
          createdAt: '2026-10-14',
        },
      ];
    throw new Error('Unexpected request');
  });
  const session = profileSession({
    ...account,
    restaurants: [{ ...account.restaurants[0], role: 'WAITER' }],
  });
  const restaurant = await fetchRestaurant(session);
  expect(restaurant.tables[0]).toMatchObject({
    id: tableId,
    number: 7,
    occupied: true,
    customers: [{ name: 'Customer', total: '300.00' }],
  });
  expect(restaurant.menu[0]).toMatchObject({
    id: dishId,
    category: 'Seasonal',
    price: 250.5,
    foodType: 'NON_VEG',
  });
  expect(
    adapter.mock.calls.some(([config]) => config.url?.endsWith('/waiters')),
  ).toBe(false);
});
test('OTP requests never attach an existing access token and use purpose-specific routes', async () => {
  const adapter = transport(() => ({
    challengeId: tableId,
    expiresIn: 300,
    resendAfter: 60,
  }));
  await authApi.requestOtp('+919876543210');
  await authApi.requestOtp('+919876543210', true);
  expect(adapter.mock.calls.map(([config]) => config.url)).toEqual([
    '/api/v1/auth/login/otp/request',
    '/api/v1/onboarding/owner/otp/request',
  ]);
  expect(
    adapter.mock.calls.every(
      ([config]) => !config.headers.has('Authorization'),
    ),
  ).toBe(true);
});
test('visit completion waits for a backend close response and returns the final snapshot bill', async () => {
  const adapter = transport(() => bill);
  expect(await restaurantApi.closeOrder(restaurantId, bill.orderId)).toEqual(
    bill,
  );
  expect(adapter.mock.calls[0][0].method).toBe('post');
  expect(adapter.mock.calls[0][0].url).toBe(
    `/api/v1/restaurants/${restaurantId}/orders/${bill.orderId}/close`,
  );
});

test('restaurant registration, profile restoration, and logout use backend tokens and APIs', async () => {
  const adapter = transport(() => account);
  const result = await authApi.register(
    'signed-onboarding-token',
    'Owner',
    'Saved Restaurant',
  );
  expect(result).toEqual(account);
  const completion = adapter.mock.calls[0][0];
  expect(completion.url).toBe('/api/v1/onboarding/owner/complete');
  expect(completion.headers.get('Authorization')).toBe(
    'Bearer signed-onboarding-token',
  );
  expect(completion.data.get('fullName')).toBe('Owner');
  expect(completion.data.get('restaurantName')).toBe('Saved Restaurant');
  await saveTokens(result);
  await authApi.me();
  await authApi.logout();
  expect(
    adapter.mock.calls
      .slice(1)
      .map(([config]) => [config.url, config.headers.get('Authorization')]),
  ).toEqual([
    ['/api/v1/auth/me', 'Bearer access-token'],
    ['/api/v1/auth/logout', 'Bearer access-token'],
  ]);
});

test('a failed restaurant save propagates the backend failure', async () => {
  const adapter = transport(() => {
    throw new Error('Restaurant could not be saved.');
  });
  await expect(
    authApi.register('signed-onboarding-token', 'Owner', 'Restaurant'),
  ).rejects.toMatchObject({ message: 'Restaurant could not be saved.' });
  expect(adapter).toHaveBeenCalledTimes(1);
});
