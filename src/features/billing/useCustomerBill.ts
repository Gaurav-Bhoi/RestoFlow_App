import { useState } from 'react';
import { useFeedback } from '../../app/FeedbackProvider';
import { useRestaurant } from '../restaurant/RestaurantProvider';
import { useSession } from '../auth/SessionProvider';
import { printCustomerReceipt } from './receiptPrinting';

export function useCustomerBill(tableId: number, customerId: string) {
  const { restaurant, dispatch } = useRestaurant();
  const { session } = useSession();
  const showFeedback = useFeedback();
  const [isPrinting, setIsPrinting] = useState(false);
  const [issuedAt] = useState(() => new Date());
  const order = restaurant.tables
    .find(table => table.id === tableId)
    ?.customers.find(customer => customer.id === customerId);
  async function printReceipt() {
    if (!order || session?.role !== 'owner' || isPrinting) {
      return false;
    }
    setIsPrinting(true);
    try {
      await printCustomerReceipt(restaurant.name, tableId, order, issuedAt);
      return true;
    } catch {
      showFeedback('Printing was cancelled or unavailable. You can try again.');
      return false;
    } finally {
      setIsPrinting(false);
    }
  }
  function finishVisit() {
    if (session?.role !== 'owner' || !order) {
      return;
    }
    dispatch({ type: 'finishVisit', tableId, customerId });
    showFeedback('Customer visit completed');
  }
  return { restaurant, order, issuedAt, isPrinting, printReceipt, finishVisit };
}
