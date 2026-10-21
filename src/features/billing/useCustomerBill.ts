import { useCallback, useEffect, useRef, useState } from 'react';
import { useFeedback } from '../../app/FeedbackProvider';
import { useRestaurant } from '../restaurant/RestaurantProvider';
import { useSession } from '../auth/SessionProvider';
import { restaurantApi } from '../../api/restoflow';
import { normalizeApiError } from '../../api/errors';
import type { ApiBill } from '../../api/types';
import { printCustomerReceipt } from './receiptPrinting';
export function useCustomerBill(tableId: string, customerId: string) {
  const { restaurant, refresh } = useRestaurant();
  const { session } = useSession();
  const showFeedback = useFeedback();
  const [bill, setBill] = useState<ApiBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const pending = useRef(false);
  const [issuedAt] = useState(() => new Date());
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const value = await restaurantApi.bill(
          restaurant.id,
          customerId,
          signal,
        );
        if (value.table.id !== tableId)
          throw new Error('The order does not belong to this table.');
        if (!signal?.aborted) {
          setBill(value);
          setError('');
        }
      } catch (cause) {
        if (!signal?.aborted) setError(normalizeApiError(cause).message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [restaurant.id, customerId, tableId],
  );
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);
  async function printReceipt() {
    if (!bill || session?.role !== 'owner' || pending.current) return false;
    pending.current = true;
    setIsPrinting(true);
    try {
      const current = await restaurantApi.bill(restaurant.id, customerId);
      if (current.table.id !== tableId)
        throw new Error('The order does not belong to this table.');
      setBill(current);
      await printCustomerReceipt(restaurant.name, current, issuedAt);
      return true;
    } catch (cause) {
      showFeedback(normalizeApiError(cause).message);
      return false;
    } finally {
      pending.current = false;
      setIsPrinting(false);
    }
  }
  async function finishVisit() {
    if (!bill || session?.role !== 'owner' || pending.current) return false;
    pending.current = true;
    setIsFinishing(true);
    try {
      await restaurantApi.closeOrder(restaurant.id, customerId);
      await refresh().catch(() => undefined);
      return true;
    } catch (cause) {
      showFeedback(normalizeApiError(cause).message);
      return false;
    } finally {
      pending.current = false;
      setIsFinishing(false);
    }
  }
  return {
    restaurant,
    bill,
    order: bill ? { name: bill.customerName ?? '', items: bill.items } : null,
    tableNumber: restaurant.tables.find(table => table.id === tableId)?.number,
    issuedAt,
    loading,
    error,
    retry: load,
    isPrinting,
    isFinishing,
    printReceipt,
    finishVisit,
  };
}
