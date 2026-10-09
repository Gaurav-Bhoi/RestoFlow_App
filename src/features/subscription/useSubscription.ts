import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { trialDaysRemaining } from '../../utils/date';
import { useRestaurant } from '../restaurant/RestaurantProvider';
import { useSession } from '../auth/SessionProvider';

export function useSubscription() {
  const { restaurant, dispatch } = useRestaurant();
  const { session } = useSession();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const interval = setInterval(refresh, 60_000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
      }
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);
  const daysRemaining = trialDaysRemaining(restaurant.trialEndsAt, now);
  const isExpired =
    !restaurant.isPremium && new Date(restaurant.trialEndsAt) <= now;
  const progress = Math.min(1, daysRemaining / 15);
  function activatePremium() {
    if (session?.role === 'owner') {
      dispatch({ type: 'activatePremium' });
    }
  }
  return { daysRemaining, isExpired, progress, activatePremium };
}
