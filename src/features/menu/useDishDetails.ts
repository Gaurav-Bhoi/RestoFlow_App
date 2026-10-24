import { useCallback, useEffect, useState } from 'react';
import { dishApi } from '../../api/dishes';
import { normalizeApiError } from '../../api/errors';
import type { ApiError } from '../../api/types';
import type { Dish } from '../restaurant/types';
import { useMenu } from './MenuProvider';

export function useDishDetails(dishId?: string) {
  const { restaurantId } = useMenu();
  const [dish, setDish] = useState<Dish>();
  const [loading, setLoading] = useState(!!dishId);
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  useEffect(() => {
    if (!dishId || !restaurantId) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setDish(undefined);
    dishApi
      .get(restaurantId, dishId, controller.signal)
      .then(value => {
        if (!controller.signal.aborted) setDish(value);
      })
      .catch(cause => {
        if (!controller.signal.aborted) setError(normalizeApiError(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [dishId, restaurantId, attempt]);
  return { dish, loading, error, retry };
}
