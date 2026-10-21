import { useTranslation } from 'react-i18next';
import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import { useSession } from '../auth/SessionProvider';
import { fetchRestaurant } from '../../api/restoflow';
import { normalizeApiError } from '../../api/errors';
import { AppButton } from '../../components/AppButton';
import { EmptyState } from '../../components/EmptyState';
import { useFeedback } from '../../app/FeedbackProvider';
import { hideStartupSplash } from '../../app/bootstrap';
import type { Restaurant, Session } from './types';
interface RestaurantContextValue {
  restaurant: Restaurant | null;
  refresh: () => Promise<void>;
  refreshing: boolean;
}
const RestaurantContext = createContext<RestaurantContextValue | null>(null);
export function RestaurantProvider({ children }: React.PropsWithChildren) {
  const { t } = useTranslation();
  const { session, signOut } = useSession();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const loadedFor = useRef<Session | null>(null);
  const latestSession = useRef(session);
  latestSession.current = session;
  const generation = useRef(0);
  const pending = useRef<AbortController | null>(null);
  const showFeedback = useFeedback();
  const refresh = useCallback(async () => {
    const account = latestSession.current;
    if (!account) return;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const expected = ++generation.current;
    setRefreshing(true);
    try {
      const value = await fetchRestaurant(account, controller.signal);
      if (
        generation.current === expected &&
        latestSession.current === account
      ) {
        loadedFor.current = account;
        setRestaurant(value);
        setError('');
      }
    } catch (cause) {
      if (
        controller.signal.aborted ||
        generation.current !== expected ||
        latestSession.current !== account
      )
        return;
      const failure = normalizeApiError(cause);
      // A trial may expire between the subscription read and operational reads.
      if (failure.status === 402) {
        try {
          const value = await fetchRestaurant(account, controller.signal);
          if (
            generation.current === expected &&
            latestSession.current === account
          ) {
            loadedFor.current = account;
            setRestaurant(value);
            setError('');
          }
        } catch (retryError) {
          if (!controller.signal.aborted && generation.current === expected) {
            setError(normalizeApiError(retryError).message);
            throw retryError;
          }
        }
      } else {
        setError(failure.message);
        throw failure;
      }
    } finally {
      if (generation.current === expected) setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    generation.current += 1;
    pending.current?.abort();
    loadedFor.current = null;
    setRestaurant(null);
    setError('');
    if (session) refresh().catch(() => undefined);
    return () => {
      generation.current += 1;
      pending.current?.abort();
    };
  }, [session, refresh]);
  useEffect(() => {
    if (!session) return;
    const reload = () => {
      refresh().catch(cause => showFeedback(normalizeApiError(cause).message));
    };
    const timer = setInterval(reload, 30_000);
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') reload();
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, [session, refresh, showFeedback]);
  useEffect(() => {
    if (error || restaurant) hideStartupSplash();
  }, [error, restaurant]);
  const available = restaurant && loadedFor.current === session;
  return (
    <RestaurantContext.Provider
      value={{ restaurant: available ? restaurant : null, refresh, refreshing }}
    >
      {!session || available ? (
        children
      ) : error ? (
        <View style={styles.error}>
          <EmptyState
            title={t('api.loadRestaurantFailed')}
            description={error}
            action={{
              label: t('api.retry'),
              onPress: () => {
                refresh().catch(() => undefined);
              },
            }}
          />
          <AppButton variant="secondary" onPress={signOut}>
            {t('api.signOut')}
          </AppButton>
        </View>
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator accessibilityLabel={t('api.loadingRestaurant')} />
        </View>
      )}
    </RestaurantContext.Provider>
  );
}
export function useRestaurantState() {
  const context = useContext(RestaurantContext);
  if (!context) throw new Error('useRestaurant requires RestaurantProvider');
  return context;
}
export function useRestaurant() {
  const context = useRestaurantState();
  if (!context.restaurant) throw new Error('Restaurant data is not loaded.');
  return { ...context, restaurant: context.restaurant };
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center' },
  error: { flex: 1, justifyContent: 'center', padding: 24 },
});
