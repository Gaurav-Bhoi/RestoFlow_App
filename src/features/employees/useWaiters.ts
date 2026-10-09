import { useState } from 'react';
import { useRestaurant } from '../restaurant/RestaurantProvider';
import { useSession } from '../auth/SessionProvider';
import { isValidPhone, normalizePhone } from '../auth/validation';

export function useWaiters() {
  const { restaurant, dispatch } = useRestaurant();
  const { session } = useSession();
  const [error, setError] = useState('');
  function addWaiter(name: string, phoneInput: string, photo?: string) {
    if (session?.role !== 'owner') {
      return false;
    }
    const phone = normalizePhone(phoneInput);
    if (!name.trim() || !isValidPhone(phone)) {
      setError('Add a name and valid mobile number.');
      return false;
    }
    if (
      phone === restaurant.phone ||
      restaurant.waiters.some(waiter => waiter.phone === phone)
    ) {
      setError('This mobile number already belongs to an account.');
      return false;
    }
    dispatch({
      type: 'addWaiter',
      waiter: { name: name.trim(), phone, photo },
    });
    return true;
  }
  return { waiters: restaurant.waiters, error, addWaiter };
}
