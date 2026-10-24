import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { dishApi } from '../../api/dishes';
import { normalizeApiError } from '../../api/errors';
import type { ApiDishInput } from '../../api/types';
import type { Dish, ProfilePhoto } from '../restaurant/types';
import { useRestaurantState } from '../restaurant/RestaurantProvider';
import { useSession } from '../auth/SessionProvider';

interface MenuContextValue {
  dishes: Dish[];
  restaurantId: string | null;
  refreshMenu: () => Promise<void>;
  cancelRefresh: () => void;
  refreshing: boolean;
  loadError: string;
  busy: boolean;
  saveDish: (
    values: ApiDishInput,
    id?: string,
    image?: ProfilePhoto,
  ) => Promise<Dish>;
  deleteDish: (id: string) => Promise<void>;
  toggleAvailability: (dish: Dish) => Promise<void>;
  notice: { message: string } | null;
  dismissNotice: () => void;
}
const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ children }: React.PropsWithChildren) {
  const { restaurant, updateMenu } = useRestaurantState();
  const { session } = useSession();
  const restaurantId = restaurant?.id ?? null;
  const [notice, setNotice] = useState<{ message: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(true);
  const listRequest = useRef<AbortController | null>(null);
  const revision = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      listRequest.current?.abort();
    };
  }, []);
  const dismissNotice = useCallback(() => setNotice(null), []);
  const cancelRefresh = useCallback(() => {
    listRequest.current?.abort();
    listRequest.current = null;
    if (mounted.current) setRefreshing(false);
  }, []);
  const refreshMenu = useCallback(async () => {
    if (!restaurantId || pending.current) return;
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    const version = revision.current;
    setRefreshing(true);
    setLoadError('');
    try {
      const dishes = await dishApi.list(restaurantId, controller.signal);
      if (
        !controller.signal.aborted &&
        mounted.current &&
        version === revision.current
      )
        updateMenu(() => dishes);
    } catch (cause) {
      if (!controller.signal.aborted && mounted.current)
        setLoadError(normalizeApiError(cause).message);
    } finally {
      if (mounted.current && listRequest.current === controller)
        setRefreshing(false);
    }
  }, [restaurantId, updateMenu]);

  async function mutate<T>(
    operation: (id: string) => Promise<T>,
    apply: (result: T, dishes: Dish[]) => Dish[],
    message: string,
  ) {
    if (!restaurantId || session?.role !== 'owner')
      throw new Error('You do not have permission for this action.');
    if (pending.current)
      throw new Error('Please wait for the current dish update.');
    pending.current = true;
    setBusy(true);
    revision.current += 1;
    cancelRefresh();
    try {
      const result = await operation(restaurantId);
      if (mounted.current) {
        updateMenu(dishes => apply(result, dishes));
        setNotice({ message });
      }
      return result;
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const saveDish = (values: ApiDishInput, id?: string, image?: ProfilePhoto) =>
    mutate(
      targetRestaurantId =>
        id
          ? dishApi.update(targetRestaurantId, id, values, image)
          : dishApi.create(targetRestaurantId, values, image),
      (dish, dishes) =>
        dishes.some(item => item.id === dish.id)
          ? dishes.map(item => (item.id === dish.id ? dish : item))
          : [dish, ...dishes],
      id ? 'menu.dishUpdated' : 'menu.dishAdded',
    );
  const deleteDish = async (id: string) => {
    await mutate(
      async targetRestaurantId => {
        const result = await dishApi.delete(targetRestaurantId, id);
        if (result.deleted !== true || result.id !== id)
          throw new Error('The backend returned an invalid deletion response.');
      },
      (_, dishes) => dishes.filter(dish => dish.id !== id),
      'menu.dishDeleted',
    );
  };
  const toggleAvailability = async (dish: Dish) => {
    await mutate(
      targetRestaurantId =>
        dishApi.update(targetRestaurantId, dish.id, {
          available: !dish.available,
        }),
      (updated, dishes) =>
        dishes.map(item => (item.id === updated.id ? updated : item)),
      dish.available
        ? 'menu.dishMarkedUnavailable'
        : 'menu.dishMarkedAvailable',
    );
  };
  return (
    <MenuContext.Provider
      value={{
        dishes: restaurant?.menu ?? [],
        restaurantId,
        refreshMenu,
        cancelRefresh,
        refreshing,
        loadError,
        busy,
        saveDish,
        deleteDish,
        toggleAvailability,
        notice,
        dismissNotice,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}
export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) throw new Error('useMenu requires MenuProvider');
  return context;
}
