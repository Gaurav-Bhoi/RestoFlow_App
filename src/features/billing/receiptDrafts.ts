import type { CustomerBill } from '../../api/billing';
import { storage } from '../../services/storage/storage';

const key = (restaurantId: string, customerId: string) =>
  `billing.pendingReceipt.${restaurantId}.${customerId}`;

// An explicit escape route when the server is unavailable. This is a local
// draft, never a paid/finished visit or a confirmed print job.
export const receiptDrafts = {
  get: (restaurantId: string, customerId: string) => {
    const bill = storage.getObject<CustomerBill>(key(restaurantId, customerId));
    if (
      bill?.orderId !== customerId ||
      !bill.table?.id ||
      !Array.isArray(bill.items) ||
      typeof bill.revision !== 'number'
    )
      return undefined;
    return bill;
  },
  keep: (restaurantId: string, bill: CustomerBill) =>
    storage.setObject(key(restaurantId, bill.orderId), bill),
  clear: (restaurantId: string, customerId: string) =>
    storage.remove(key(restaurantId, customerId)),
};
