import { getDish } from '../menu/menuData';
import type { DishId, OrderItems } from '../restaurant/types';

export function orderLines(items: OrderItems) {
  return (Object.keys(items) as DishId[])
    .filter(id => (items[id] ?? 0) > 0)
    .map(id => ({
      dish: getDish(id),
      quantity: items[id]!,
      amount: getDish(id).price * items[id]!,
    }));
}
export function calculateOrderTotal(items: OrderItems) {
  return orderLines(items).reduce((total, line) => total + line.amount, 0);
}
export function countOrderItems(items: OrderItems) {
  return Object.values(items).reduce(
    (count, quantity) => count + (quantity ?? 0),
    0,
  );
}
export function changeQuantity(
  items: OrderItems,
  id: DishId,
  change: number,
): OrderItems {
  const updatedItems = { ...items };
  const quantity = Math.max(0, (items[id] ?? 0) + change);
  if (quantity === 0) {
    delete updatedItems[id];
  } else {
    updatedItems[id] = quantity;
  }
  return updatedItems;
}
