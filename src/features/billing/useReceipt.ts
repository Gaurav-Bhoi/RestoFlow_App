import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { printCustomerBill } from './billPrinter';
import {
  billingApi,
  type BillDraft,
  type BillPrintJob,
  type CustomerBill,
} from '../../api/billing';
import { normalizeApiError } from '../../api/errors';
import { useRestaurant } from '../restaurant/RestaurantProvider';
import { useSession } from '../auth/SessionProvider';
import { billDraft, billId } from './billDraft';
import { billPdfLabels, shareBill } from './billExport';

export function useReceipt(
  tableId: string,
  customerId: string,
  input?: BillDraft,
) {
  const { t, i18n } = useTranslation();
  const { restaurant } = useRestaurant();
  const { session } = useSession();
  const [bill, setBill] = useState<CustomerBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const printRequest = useRef<{ id: string; draft: BillDraft } | null>(null);
  const printJob = useRef<BillPrintJob | null>(null);
  const nativeDispatched = useRef(false);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const value = input
          ? await billingApi.preview(restaurant.id, customerId, input, signal)
          : await billingApi.get(restaurant.id, customerId, signal);
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
    [restaurant.id, customerId, tableId, input],
  );
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);
  async function print(): Promise<string | null> {
    if (!bill || pending.current || session?.role !== 'owner') return null;
    pending.current = true;
    setBusy(true);
    setPrinting(true);
    setError('');
    try {
      // A network retry reuses this exact request, including its original revision.
      printRequest.current ??= { id: billId(), draft: billDraft(bill) };
      const request = printRequest.current;
      const job =
        printJob.current ??
        (await billingApi.createPrintJob(
          restaurant.id,
          customerId,
          request.draft,
          request.id,
        ));
      printJob.current = job;
      setBill(job.receipt);
      if (job.status === 'SENT' || job.status === 'CONFIRMED') return job.id;
      if (!nativeDispatched.current) {
        const html = await billingApi.printHtml(
          restaurant.id,
          customerId,
          job.id,
        );
        await printCustomerBill(
          html,
          `${job.receipt.restaurantName} - ${
            job.receipt.customerName ?? job.receipt.orderId
          }`,
        );
        nativeDispatched.current = true;
      }
      const sent = await billingApi.updatePrintJob(
        restaurant.id,
        customerId,
        job.id,
        'SENT',
      );
      printJob.current = sent;
      return sent.id;
    } catch (cause) {
      setError(normalizeApiError(cause).message);
      // A dismissed/failed native dialog must never close the customer's visit.
      // After native success, retain PENDING for status retry without printing twice.
      if (!nativeDispatched.current && printJob.current) {
        await billingApi
          .updatePrintJob(
            restaurant.id,
            customerId,
            printJob.current.id,
            normalizeApiError(cause).code === 'PRINT_CANCELLED'
              ? 'CANCELLED'
              : 'FAILED',
          )
          .catch(() => undefined);
        printRequest.current = null;
        printJob.current = null;
      }
      return null;
    } finally {
      pending.current = false;
      setBusy(false);
      setPrinting(false);
    }
  }
  async function share(channel: 'WHATSAPP' | 'EMAIL') {
    if (!bill || pending.current || session?.role !== 'owner') return false;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      const saved = await billingApi.save(
        restaurant.id,
        customerId,
        billDraft(bill),
      );
      // Keep the saved revision even if the native share is dismissed or fails.
      setBill(saved);
      printRequest.current = null;
      printJob.current = null;
      nativeDispatched.current = false;
      await shareBill(saved, billPdfLabels(t), i18n.language, channel);
      return true;
    } catch (cause) {
      setError(normalizeApiError(cause).message);
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return { bill, loading, busy, printing, error, load, print, share };
}
