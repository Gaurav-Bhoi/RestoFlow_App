import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useRestaurant } from '../restaurant/RestaurantProvider';
import { useSession } from '../auth/SessionProvider';
import type { DishId } from '../restaurant/types';
import {
  calculateOrderTotal,
  countOrderItems,
  changeQuantity,
} from './orderCalculations';

export function useOrderDraft(tableId: number, customerId?: string) {
  const { t } = useTranslation();
  const { restaurant, dispatch } = useRestaurant();
  const { session } = useSession();
  const table = restaurant.tables.find(item => item.id === tableId);
  const existingOrder = table?.customers.find(order => order.id === customerId);
  const [initialOrder] = useState(() => ({
    name: existingOrder?.name ?? '',
    items: { ...existingOrder?.items },
  }));
  const [name, setName] = useState(initialOrder.name);
  const [items, setItems] = useState(initialOrder.items);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const isDirty =
    name !== initialOrder.name ||
    JSON.stringify(items) !== JSON.stringify(initialOrder.items);
  function updateQuantity(id: DishId, change: number) {
    setItems(currentItems => changeQuantity(currentItems, id, change));
    setError('');
  }
  function saveOrder() {
    if (session?.role !== 'waiter' || !table) {
      return false;
    }
    if (!name.trim()) {
      setError(t('orders.addTheCustomerSNameBeforeConfirming'));
      return false;
    }
    if (!countOrderItems(items)) {
      setError(t('orders.addAtLeastOneDishBeforeConfirming'));
      return false;
    }
    dispatch({
      type: 'saveOrder',
      tableId,
      order: {
        id:
          existingOrder?.id ??
          `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim(),
        items: { ...items },
      },
    });
    return true;
  }
  return {
    name,
    setName,
    items,
    search,
    setSearch,
    error,
    isDirty,
    isEditing: !!existingOrder,
    isAvailable: !!table && (!customerId || !!existingOrder),
    itemCount: countOrderItems(items),
    total: calculateOrderTotal(items),
    updateQuantity,
    saveOrder,
  };
}
