import type { AuthResult, ApiBill, Subscription } from '../../src/api/types';
export const DEV_ORIGIN =
  'https://restoflow-backend-dev.gauravbhoiofficial.workers.dev';
export const PROD_ORIGIN =
  'https://restoflow-backend.gauravbhoiofficial.workers.dev';
export const restaurantId = '10000000-0000-4000-8000-000000000001';
export const tableId = '10000000-0000-4000-8000-000000000002';
export const dishId = '10000000-0000-4000-8000-000000000003';
export const orderId = '10000000-0000-4000-8000-000000000004';
export const subscription: Subscription = {
  plan: 'FREE_TRIAL',
  state: 'FREE_TRIAL_ACTIVE',
  isActive: true,
  trialStartedAt: '2090-01-01T00:00:00Z',
  trialEndsAt: '2090-01-31T00:00:00Z',
  lifetimeGrantedAt: null,
};
export const account: AuthResult = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  accessTokenExpiresIn: 900,
  refreshTokenExpiresIn: 2592000,
  user: {
    id: '10000000-0000-4000-8000-000000000005',
    fullName: 'Test Owner',
    phoneNumber: '+919876543210',
    profileImageUrl: null,
  },
  restaurants: [
    { id: restaurantId, name: 'Test Restaurant', role: 'OWNER', subscription },
  ],
};
export const bill: ApiBill = {
  orderId,
  customerName: 'Test Guest',
  table: { id: tableId, name: 'Table 1' },
  items: [
    {
      name: 'Snapshot Rice',
      quantity: 2,
      note: null,
      unitPrice: '150.00',
      lineTotal: '300.00',
    },
  ],
  subtotal: '300.00',
  total: '300.00',
  currency: 'INR',
};
