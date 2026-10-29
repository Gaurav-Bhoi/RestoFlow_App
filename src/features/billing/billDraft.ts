import type { BillDraft, BillLine, CustomerBill } from '../../api/billing';
import { paiseMoney, pricePaise } from '../orders/orderCalculations';

// IDs identify bill lines and retry requests; they are never bearer credentials.
export function billId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
    const random = Math.floor(Math.random() * 16);
    return (character === 'x' ? random : (random % 4) + 8).toString(16);
  });
}
export function normalizePrice(value: string): string | null {
  const text = value.trim().replace(/^₹\s*/, '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  const paise = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return paise <= 2147483647n ? paiseMoney(paise) : null;
}
export function billDraft(bill: CustomerBill, items = bill.items): BillDraft {
  return {
    expectedRevision: bill.revision,
    // Keep the server's microseconds intact for optimistic concurrency.
    expectedOrderUpdatedAt: bill.orderUpdatedAt,
    items: items.map(({ lineTotal: _, ...line }) => ({ ...line })),
  };
}
export function calculateBill(
  bill: CustomerBill,
  items: BillLine[],
): CustomerBill {
  const lines = items.map(line => ({
    ...line,
    lineTotal: paiseMoney(pricePaise(line.unitPrice) * BigInt(line.quantity)),
  }));
  const subtotal = paiseMoney(
    lines.reduce((sum, line) => sum + pricePaise(line.lineTotal), 0n),
  );
  return {
    ...bill,
    items: lines,
    dishCount: lines.length,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal,
    total: paiseMoney(pricePaise(subtotal) + pricePaise(bill.taxesAndCharges)),
  };
}
export function billItemsEqual(left: BillLine[], right: BillLine[]) {
  const comparable = (items: BillLine[]) =>
    items.map(({ id, dishId, name, quantity, unitPrice, note }) => [
      id,
      dishId,
      name,
      quantity,
      unitPrice,
      note,
    ]);
  return JSON.stringify(comparable(left)) === JSON.stringify(comparable(right));
}
