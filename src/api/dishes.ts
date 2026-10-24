import { listPages, menuDish, photoForm, requestData } from './restoflow';
import type { ApiDish, ApiDishInput } from './types';
import type { ProfilePhoto } from '../features/restaurant/types';

const path = (restaurantId: string) =>
  `/api/v1/restaurants/${encodeURIComponent(restaurantId)}/menu/dishes`;
const dishPath = (restaurantId: string, dishId: string) =>
  `${path(restaurantId)}/${encodeURIComponent(dishId)}`;

function dishForm(values: Partial<ApiDishInput>, image?: ProfilePhoto) {
  const fields = Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );
  return photoForm(fields, image);
}

export const dishApi = {
  list: async (restaurantId: string, signal?: AbortSignal) =>
    (await listPages<ApiDish>(path(restaurantId), {}, signal)).map(menuDish),
  get: async (restaurantId: string, dishId: string, signal?: AbortSignal) =>
    menuDish(
      await requestData<ApiDish>(
        'GET',
        dishPath(restaurantId, dishId),
        undefined,
        { signal },
      ),
    ),
  create: async (
    restaurantId: string,
    values: ApiDishInput,
    image?: ProfilePhoto,
  ) =>
    menuDish(
      await requestData<ApiDish>(
        'POST',
        path(restaurantId),
        dishForm(values, image),
      ),
    ),
  update: async (
    restaurantId: string,
    dishId: string,
    values: Partial<ApiDishInput>,
    image?: ProfilePhoto,
  ) =>
    menuDish(
      await requestData<ApiDish>(
        'PATCH',
        dishPath(restaurantId, dishId),
        dishForm(values, image),
      ),
    ),
  delete: (restaurantId: string, dishId: string) =>
    requestData<{ id: string; deleted: true }>(
      'DELETE',
      dishPath(restaurantId, dishId),
    ),
};
