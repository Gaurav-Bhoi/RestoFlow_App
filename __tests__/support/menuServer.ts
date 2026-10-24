import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiDish } from '../../src/api/types';
import type { Dish } from '../../src/features/restaurant/types';
import { account, restaurantId, subscription } from './apiFixtures';

export const dishBase = `/api/v1/restaurants/${restaurantId}/menu/dishes`;
export function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
}
export function menuServer(initialDishes: Dish[]) {
  let dishes: ApiDish[] = initialDishes.map((dish, index) => ({
    ...dish,
    id: `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    price: dish.price.toFixed(2),
    imageUrl: null,
  }));
  let nextId = 1000;
  const controls: {
    failure: {
      method: string;
      status: number;
      message?: string;
      url?: string;
    } | null;
    holdWrite: ReturnType<typeof deferred<void>> | null;
    holdList: ReturnType<typeof deferred<void>> | null;
  } = { failure: null, holdWrite: null, holdList: null };
  const adapter = jest.fn(async (config: InternalAxiosRequestConfig) => {
    const url = config.url!;
    const method = config.method!;
    let data: unknown;
    const failure = controls.failure;
    if (
      failure &&
      failure.method === method &&
      url.startsWith(dishBase) &&
      (!failure.url || failure.url === url)
    ) {
      controls.failure = null;
      throw new AxiosError(
        'request failed',
        'ERR_BAD_RESPONSE',
        config,
        undefined,
        {
          config,
          status: failure.status,
          statusText: 'Failed',
          headers: { 'x-restoflow-environment': 'development' },
          data: {
            success: false,
            error: {
              code: 'DISH_REQUEST_FAILED',
              message: failure.message ?? 'Dish request failed.',
            },
          },
        },
      );
    }
    if (url === dishBase && method === 'get') {
      const snapshot = dishes.slice(
        Number(config.params.offset),
        Number(config.params.offset) + Number(config.params.limit),
      );
      if (controls.holdList) {
        const hold = controls.holdList;
        controls.holdList = null;
        await hold.promise;
      }
      data = snapshot;
    } else if (url.startsWith(dishBase)) {
      if (controls.holdWrite && method !== 'get')
        await controls.holdWrite.promise;
      const id = url.slice(dishBase.length + 1);
      if (method === 'get') data = dishes.find(dish => dish.id === id);
      else if (method === 'delete') {
        dishes = dishes.filter(dish => dish.id !== id);
        data = { id, deleted: true };
      } else {
        const fields = Object.fromEntries(
          [
            'name',
            'description',
            'price',
            'category',
            'foodType',
            'available',
          ].flatMap(key => {
            const value = config.data.get(key);
            return value === null
              ? []
              : [[key, key === 'available' ? value === 'true' : value]];
          }),
        );
        if (method === 'post') {
          const created = {
            id: `20000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`,
            ...fields,
            imageUrl: config.data.get('image')
              ? '/api/v1/media/restaurants/test/dish.jpg'
              : null,
          } as ApiDish;
          dishes = [created, ...dishes];
          data = created;
        } else {
          const original = dishes.find(dish => dish.id === id)!;
          const updated = {
            ...original,
            ...fields,
            imageUrl: config.data.get('image')
              ? '/api/v1/media/restaurants/test/replacement.jpg'
              : original.imageUrl,
          } as ApiDish;
          dishes = dishes.map(dish => (dish.id === id ? updated : dish));
          data = updated;
        }
      }
    } else if (url.endsWith('/subscription')) data = subscription;
    else if (url.endsWith('/dashboard'))
      data = {
        totalTables: 0,
        occupiedTables: 0,
        guestCount: 0,
        availableTables: 0,
        openOrderTotal: '0.00',
        currency: 'INR',
      };
    else if (
      url.endsWith('/tables') ||
      url.endsWith('/orders') ||
      url.endsWith('/waiters')
    )
      data = [];
    else if (url === `/api/v1/restaurants/${restaurantId}`)
      data = { name: account.restaurants[0].name, owner: account.user };
    else throw new Error(`Unexpected request ${method} ${url}`);
    return {
      status: method === 'post' ? 201 : 200,
      statusText: 'OK',
      data: { success: true, data },
      headers: { 'x-restoflow-environment': 'development' },
      config,
    };
  });
  return {
    adapter,
    controls,
    get dishes() {
      return dishes;
    },
  };
}
