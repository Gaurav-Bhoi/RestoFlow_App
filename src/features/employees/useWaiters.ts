import { useRef, useState } from 'react';
import { useRestaurant } from '../restaurant/RestaurantProvider';
import { useSession } from '../auth/SessionProvider';
import { restaurantApi } from '../../api/restoflow';
import { normalizeApiError } from '../../api/errors';
import { toE164Phone } from '../auth/validation';
import type { ProfilePhoto } from '../restaurant/types';
export function useWaiters() {
  const { restaurant, refresh } = useRestaurant();
  const { session } = useSession();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  async function addWaiter(name: string, phone: string, photo?: ProfilePhoto) {
    if (session?.role !== 'owner' || pending.current) return false;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      if (name.trim().length < 2)
        throw new Error('Enter the waiter’s full name.');
      await restaurantApi.createWaiter(
        restaurant.id,
        name.trim(),
        toE164Phone(phone),
        photo,
      );
      await refresh().catch(() => undefined);
      return true;
    } catch (cause) {
      setError(normalizeApiError(cause).message);
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return { waiters: restaurant.waiters, error, busy, addWaiter };
}
