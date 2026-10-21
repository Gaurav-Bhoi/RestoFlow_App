import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { trialDaysRemaining } from '../../utils/date';
import { useRestaurantState } from '../restaurant/RestaurantProvider';
import { useSession } from '../auth/SessionProvider';
import { restaurantApi } from '../../api/restoflow';
export function useSubscription() {
  const { restaurant, refresh } = useRestaurantState();
  const { session } = useSession();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const update = () => setNow(new Date());
    const timer = setInterval(update, 60_000);
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') update();
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, []);
  const subscription = restaurant?.subscription;
  const daysRemaining = subscription
    ? trialDaysRemaining(subscription.trialEndsAt, now)
    : 0;
  const isExpired =
    !!subscription &&
    (subscription.state === 'FREE_TRIAL_EXPIRED' ||
      (subscription.plan !== 'LIFETIME' &&
        new Date(subscription.trialEndsAt) <= now));
  const duration = subscription
    ? Math.max(
        1,
        Math.ceil(
          (Date.parse(subscription.trialEndsAt) -
            Date.parse(subscription.trialStartedAt)) /
            86400000,
        ),
      )
    : 30;
  async function checkActivation() {
    if (!session) return false;
    const current = await restaurantApi.subscription(session.restaurantId);
    await refresh();
    return current.isActive;
  }
  return {
    daysRemaining,
    trialDays: duration,
    isExpired,
    progress: Math.min(1, daysRemaining / duration),
    checkActivation,
  };
}
