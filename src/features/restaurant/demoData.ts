import type { Restaurant } from './types';

export function createDemoRestaurant(): Restaurant {
  return {
    name: 'Saffron Kitchen',
    owner: 'Gaurav',
    phone: '9876543210',
    isPremium: false,
    trialStartedAt: '2026-10-02T00:00:00+05:30',
    trialEndsAt: '2026-10-17T23:59:59+05:30',
    waiters: [
      { name: 'Ravi', phone: '9876543211' },
      { name: 'Sneha', phone: '9876543213' },
    ],
    tables: [
      {
        id: 1,
        customers: [
          { id: 'rahul', name: 'Rahul', items: { dal: 1, roti: 3, rice: 1 } },
          { id: 'amit', name: 'Amit', items: { paneer: 1, naan: 2, coke: 1 } },
        ],
      },
      { id: 2, customers: [] },
      { id: 3, customers: [] },
      { id: 4, customers: [] },
    ],
    nextTableId: 5,
  };
}
