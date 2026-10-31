import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  billingApi,
  type BillLine,
  type CustomerBill,
} from '../../api/billing';
import { normalizeApiError } from '../../api/errors';
import { useRestaurant } from '../restaurant/RestaurantProvider';
import { useSession } from '../auth/SessionProvider';
import { billDraft, billItemsEqual, calculateBill } from './billDraft';
import { receiptDrafts } from './receiptDrafts';

export function useBillDraft(tableId: string, customerId: string) {
  const { restaurant, refresh } = useRestaurant();
  const { session } = useSession();
  const [original, setOriginal] = useState<CustomerBill | null>(null);
  const [items, setItems] = useState<BillLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [localDraft, setLocalDraft] = useState(false);
  const pending = useRef(false);
  const dirty = !!original && !billItemsEqual(original.items, items);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const current = useRef({ original, items });
  current.current = { original, items };
  const load = useCallback(
    async (signal?: AbortSignal, preserve = false) => {
      setLoading(true);
      try {
        const value = await billingApi.get(restaurant.id, customerId, signal);
        if (value.table.id !== tableId)
          throw new Error('The order does not belong to this table.');
        if (!signal?.aborted) {
          const previous = current.current;
          const kept =
            preserve && !previous.original
              ? receiptDrafts.get(restaurant.id, customerId)
              : undefined;
          if (kept && kept.table.id === tableId && !value.closedAt) {
            setOriginal(value);
            setItems(kept.items);
            setLocalDraft(true);
            setConflict(
              value.revision !== kept.revision ||
                value.orderUpdatedAt !== kept.orderUpdatedAt,
            );
            return;
          }
          if (
            preserve &&
            dirtyRef.current &&
            previous.original &&
            !billItemsEqual(value.items, previous.items)
          ) {
            // Returning from an unsaved preview keeps the local draft. A save or
            // share performed there is accepted only when its lines match ours.
            if (
              value.revision !== previous.original.revision ||
              value.orderUpdatedAt !== previous.original.orderUpdatedAt
            ) {
              setConflict(true);
            }
            return;
          }
          setOriginal(value);
          setItems(value.items);
          setError('');
          setConflict(false);
          setLocalDraft(false);
          if (!preserve) receiptDrafts.clear(restaurant.id, customerId);
        }
      } catch (cause) {
        if (!signal?.aborted) setError(normalizeApiError(cause).message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [restaurant.id, customerId, tableId],
  );
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      // Preserve an unsaved bill when returning from its receipt preview.
      load(controller.signal, true);
      return () => controller.abort();
    }, [load]),
  );
  async function save() {
    if (
      !original ||
      original.closedAt ||
      !items.length ||
      conflict ||
      pending.current ||
      session?.role !== 'owner'
    )
      return false;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      const saved = await billingApi.save(
        restaurant.id,
        customerId,
        billDraft(original, items),
      );
      setOriginal(saved);
      setItems(saved.items);
      receiptDrafts.clear(restaurant.id, customerId);
      setLocalDraft(false);
      refresh().catch(() => undefined);
      return true;
    } catch (cause) {
      const failure = normalizeApiError(cause);
      setError(failure.message);
      setConflict(failure.status === 409);
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return {
    restaurant,
    original,
    items,
    setItems,
    loading,
    busy,
    error,
    conflict,
    localDraft,
    dirty,
    load,
    save,
    bill: original ? calculateBill(original, items) : null,
    draft: original ? billDraft(original, items) : null,
  };
}
