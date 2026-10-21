import type { OrderItems } from '../restaurant/types';
export function countOrderItems(items: OrderItems) {
  return Object.values(items).reduce((count, quantity) => count + quantity, 0);
}
export function changeQuantity(
  items: OrderItems,
  id: string,
  change: number,
): OrderItems {
  const updated = { ...items };
  const quantity = Math.max(0, Math.min(10_000, (items[id] ?? 0) + change));
  if (quantity === 0) delete updated[id];
  else updated[id] = quantity;
  return updated;
}
export function pricePaise(price: string) {
  if (!/^\d+\.\d{2}$/.test(price))
    throw new Error('Invalid price returned by the backend.');
  return BigInt(price.replace('.', ''));
}
export function paiseMoney(paise: bigint) {
  return `${paise / 100n}.${(paise % 100n).toString().padStart(2, '0')}`;
}
