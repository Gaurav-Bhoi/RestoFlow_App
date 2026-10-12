import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useFeedback } from '../../app/FeedbackProvider';
import { useSession } from '../auth/SessionProvider';
import { useRestaurant } from '../restaurant/RestaurantProvider';

export type TableFilter = 'All tables' | 'Available' | 'Occupied';
export function useTables() {
  const { t } = useTranslation();
  const { restaurant, dispatch } = useRestaurant();
  const { session } = useSession();
  const showFeedback = useFeedback();
  const [filter, setFilter] = useState<TableFilter>('All tables');
  const [isEditing, setIsEditing] = useState(false);
  const [tableToRemove, setTableToRemove] = useState<number | null>(null);
  const canManage = session?.role === 'owner';
  const occupiedCount = restaurant.tables.filter(
    table => table.customers.length > 0,
  ).length;
  const guestCount = restaurant.tables.reduce(
    (total, table) => total + table.customers.length,
    0,
  );
  const visibleTables = restaurant.tables.filter(
    table =>
      filter === 'All tables' ||
      (filter === 'Occupied'
        ? table.customers.length > 0
        : table.customers.length === 0),
  );
  function addTable() {
    if (!canManage) {
      return;
    }
    dispatch({ type: 'addTable' });
    setFilter('All tables');
    showFeedback(
      t('dashboard.tableValueAdded', { value0: restaurant.nextTableId }),
    );
  }
  function removeTable() {
    if (!canManage || !tableToRemove) {
      return;
    }
    const table = restaurant.tables.find(item => item.id === tableToRemove);
    if (!table || table.customers.length > 0) {
      return;
    }
    dispatch({ type: 'removeTable', tableId: tableToRemove });
    setTableToRemove(null);
    showFeedback(t('dashboard.tableRemoved'));
  }
  return {
    restaurant,
    canManage,
    occupiedCount,
    guestCount,
    visibleTables,
    filter,
    setFilter,
    isEditing,
    setIsEditing,
    tableToRemove,
    setTableToRemove,
    addTable,
    removeTable,
  };
}
