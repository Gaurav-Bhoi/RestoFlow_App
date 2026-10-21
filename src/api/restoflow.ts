import type { AxiosRequestConfig } from 'axios';
import { apiClient } from './client';
import { ENV } from '../config/env';
import { USE_MOCK_OTP } from '../config/auth';
import { mockOtp } from '../services/auth/mockOtp';
import type {
  AccountProfile,
  ApiBill,
  ApiDish,
  ApiOrder,
  ApiOrderSummary,
  ApiTable,
  ApiUser,
  ApiWaiter,
  AuthResult,
  Dashboard,
  OtpChallenge,
  Subscription,
} from './types';
import type {
  CustomerOrder,
  Dish,
  ProfilePhoto,
  Restaurant,
  Session,
} from '../features/restaurant/types';
export async function requestData<T>(
  method: string,
  path: string,
  data?: unknown,
  config: AxiosRequestConfig = {},
): Promise<T> {
  const response = await apiClient.request({
    method,
    url: path,
    data,
    ...config,
  });
  if (response.data?.success !== true || response.data.data === undefined)
    throw new Error('The backend returned an invalid response.');
  return response.data.data as T;
}
export function mediaUrl(path: string | null): string | undefined {
  if (!path) return undefined;
  const url = new URL(path, ENV.API_BASE_URL);
  if (
    url.origin !== ENV.API_BASE_URL ||
    !url.pathname.startsWith('/api/v1/media/') ||
    url.username ||
    url.password
  )
    throw new Error('The media origin does not match this application.');
  return url.href;
}
export function profileSession(profile: AccountProfile): Session {
  const restaurant = profile.restaurants[0];
  if (!restaurant)
    throw new Error('This account has no active restaurant membership.');
  return {
    userId: profile.user.id,
    restaurantId: restaurant.id,
    restaurants: profile.restaurants,
    role: restaurant.role === 'OWNER' ? 'owner' : 'waiter',
    name: profile.user.fullName,
    phone: profile.user.phoneNumber,
    photo: mediaUrl(profile.user.profileImageUrl),
  };
}
export function photoForm(
  fields: Record<string, string>,
  image?: ProfilePhoto,
) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  if (image) body.append('image', image as unknown as Blob);
  return body;
}
export const authApi = {
  checkPhone: (phoneNumber: string) =>
    requestData<{ registered: boolean }>(
      'POST',
      '/api/v1/auth/phone/check',
      { phoneNumber },
      { sessionAuth: false },
    ),
  requestOtp: (phoneNumber: string, ownerRegistration = false) => {
    if (USE_MOCK_OTP) return mockOtp.request(phoneNumber, ownerRegistration);
    // Real OTP API is disabled while development uses the local mock.
    return requestData<OtpChallenge>(
      'POST',
      `/api/v1/${
        ownerRegistration ? 'onboarding/owner' : 'auth/login'
      }/otp/request`,
      { phoneNumber },
      { sessionAuth: false },
    );
  },
  verifyLogin: async (challengeId: string, otp: string) => {
    if (USE_MOCK_OTP) {
      const phoneNumber = mockOtp.verify(challengeId, otp, false);
      const result = await requestData<AuthResult>(
        'POST',
        '/api/v1/auth/login',
        { phoneNumber },
        { sessionAuth: false },
      );
      mockOtp.consume(challengeId);
      return result;
    }
    // Real OTP verification API is disabled in development mock mode.
    return requestData<AuthResult>(
      'POST',
      '/api/v1/auth/login/otp/verify',
      { challengeId, otp },
      { sessionAuth: false },
    );
  },
  verifyRegistration: async (challengeId: string, otp: string) => {
    if (USE_MOCK_OTP) {
      const phoneNumber = mockOtp.verify(challengeId, otp, true);
      mockOtp.consume(challengeId);
      return {
        onboardingToken: `dev-mock-onboarding:${phoneNumber}`,
        expiresIn: 900,
      };
    }
    // Real OTP verification API is disabled in development mock mode.
    return requestData<{ onboardingToken: string; expiresIn: number }>(
      'POST',
      '/api/v1/onboarding/owner/otp/verify',
      { challengeId, otp },
      { sessionAuth: false },
    );
  },
  register: (
    token: string,
    fullName: string,
    restaurantName: string,
    image?: ProfilePhoto,
  ) =>
    requestData<AuthResult>(
      'POST',
      '/api/v1/onboarding/owner/complete',
      photoForm({ fullName, restaurantName }, image),
      { sessionAuth: false, onboardingToken: token },
    ),
  me: (signal?: AbortSignal) =>
    requestData<AccountProfile>('GET', '/api/v1/auth/me', undefined, {
      signal,
    }),
  logout: () => requestData<{ loggedOut: true }>('POST', '/api/v1/auth/logout'),
};
const base = (restaurantId: string) =>
  `/api/v1/restaurants/${encodeURIComponent(restaurantId)}`;
export async function listPages<T>(
  path: string,
  params: Record<string, string> = {},
  signal?: AbortSignal,
): Promise<T[]> {
  const records: T[] = [];
  for (let offset = 0; offset <= 1_000_000; offset += 100) {
    const page = await requestData<T[]>('GET', path, undefined, {
      params: { ...params, limit: 100, offset },
      signal,
    });
    if (!Array.isArray(page))
      throw new Error('The backend returned an invalid list.');
    records.push(...page);
    if (page.length < 100) return records;
  }
  throw new Error('The result is too large. Please narrow the filters.');
}
export function customerOrder(
  order: ApiOrderSummary | ApiOrder,
): CustomerOrder {
  return {
    id: order.id,
    name: order.customerName ?? '',
    items: 'items' in order ? order.items : [],
    itemCount: order.itemCount,
    total: order.total,
    createdAt: order.createdAt,
  };
}
export function menuDish(dish: ApiDish): Dish {
  return {
    id: dish.id,
    name: dish.name,
    description: dish.description ?? '',
    price: Number(dish.price),
    category: dish.category,
    foodType: dish.foodType,
    available: dish.available,
    imageUrl: mediaUrl(dish.imageUrl),
  };
}
export const restaurantApi = {
  subscription: (id: string, signal?: AbortSignal) =>
    requestData<Subscription>('GET', `${base(id)}/subscription`, undefined, {
      signal,
    }),
  createTable: (id: string) =>
    requestData<{ id: string; tableNumber: number; name: string }>(
      'POST',
      `${base(id)}/tables`,
    ),
  deleteTable: (id: string, tableId: string) =>
    requestData<{ deleted: true }>(
      'DELETE',
      `${base(id)}/tables/${encodeURIComponent(tableId)}`,
    ),
  createWaiter: (
    id: string,
    fullName: string,
    phoneNumber: string,
    image?: ProfilePhoto,
  ) =>
    requestData<ApiWaiter>(
      'POST',
      `${base(id)}/waiters`,
      image
        ? photoForm({ fullName, phoneNumber }, image)
        : { fullName, phoneNumber },
    ),
  getOrder: (id: string, orderId: string, signal?: AbortSignal) =>
    requestData<ApiOrder>(
      'GET',
      `${base(id)}/orders/${encodeURIComponent(orderId)}`,
      undefined,
      { signal },
    ),
  createOrder: (
    id: string,
    tableId: string,
    customerName: string,
    items: { dishId: string; quantity: number }[],
  ) =>
    requestData<ApiOrder>('POST', `${base(id)}/orders`, {
      tableId,
      customerName,
      items,
    }),
  renameOrder: (id: string, orderId: string, customerName: string) =>
    requestData<ApiOrder>(
      'PATCH',
      `${base(id)}/orders/${encodeURIComponent(orderId)}`,
      { customerName },
    ),
  addItem: (id: string, orderId: string, dishId: string, quantity: number) =>
    requestData(
      'POST',
      `${base(id)}/orders/${encodeURIComponent(orderId)}/items`,
      { dishId, quantity },
    ),
  updateItem: (id: string, orderId: string, itemId: string, quantity: number) =>
    requestData(
      'PATCH',
      `${base(id)}/orders/${encodeURIComponent(
        orderId,
      )}/items/${encodeURIComponent(itemId)}`,
      { quantity },
    ),
  removeItem: (id: string, orderId: string, itemId: string) =>
    requestData(
      'DELETE',
      `${base(id)}/orders/${encodeURIComponent(
        orderId,
      )}/items/${encodeURIComponent(itemId)}`,
    ),
  bill: (id: string, orderId: string, signal?: AbortSignal) =>
    requestData<ApiBill>(
      'GET',
      `${base(id)}/orders/${encodeURIComponent(orderId)}/bill`,
      undefined,
      { signal },
    ),
  closeOrder: (id: string, orderId: string) =>
    requestData<ApiBill>(
      'POST',
      `${base(id)}/orders/${encodeURIComponent(orderId)}/close`,
    ),
};
export async function fetchRestaurant(
  session: Session,
  signal?: AbortSignal,
): Promise<Restaurant> {
  const id = session.restaurantId;
  const summary = session.restaurants.find(value => value.id === id)!;
  const subscription = await restaurantApi.subscription(id, signal);
  const restaurant: Restaurant = {
    id,
    name: summary.name,
    owner: '',
    phone: '',
    isPremium: subscription.plan === 'LIFETIME',
    trialStartedAt: subscription.trialStartedAt,
    trialEndsAt: subscription.trialEndsAt,
    subscription,
    tables: [],
    waiters: [],
    menu: [],
    dashboard: null,
  };
  if (!subscription.isActive) return restaurant;
  const [detail, tables, menu, openOrders, dashboard, waiters] =
    await Promise.all([
      requestData<{ name: string; owner: ApiUser }>(
        'GET',
        base(id),
        undefined,
        { signal },
      ),
      listPages<ApiTable>(`${base(id)}/tables`, {}, signal),
      listPages<ApiDish>(`${base(id)}/menu/dishes`, {}, signal),
      listPages<ApiOrderSummary>(
        `${base(id)}/orders`,
        { closed: 'false' },
        signal,
      ),
      requestData<Dashboard>('GET', `${base(id)}/dashboard`, undefined, {
        signal,
      }),
      session.role === 'owner'
        ? listPages<ApiWaiter>(
            `${base(id)}/waiters`,
            { status: 'ACTIVE' },
            signal,
          )
        : Promise.resolve([]),
    ]);
  return {
    ...restaurant,
    name: detail.name,
    owner: detail.owner.fullName,
    phone: detail.owner.phoneNumber,
    photo: mediaUrl(detail.owner.profileImageUrl),
    dashboard,
    menu: menu.map(menuDish),
    waiters: waiters.map(value => ({
      id: value.id,
      name: value.fullName,
      phone: value.phoneNumber,
      photo: mediaUrl(value.profileImageUrl),
    })),
    tables: tables.map(value => ({
      id: value.id,
      number: value.tableNumber,
      occupied: value.occupied,
      guestCount: value.openOrderCount,
      customers: openOrders
        .filter(order => order.tableId === value.id)
        .map(customerOrder),
    })),
  };
}
