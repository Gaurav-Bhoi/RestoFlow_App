import { countOrderItems } from '../orders/orderCalculations';
import type { CustomerOrder, Restaurant, Waiter } from './types';

export type RestaurantAction =
  | { type: 'replace'; restaurant: Restaurant }
  | { type: 'addTable' }
  | { type: 'removeTable'; tableId: number }
  | { type: 'saveOrder'; tableId: number; order: CustomerOrder }
  | { type: 'finishVisit'; tableId: number; customerId: string }
  | { type: 'addWaiter'; waiter: Waiter }
  | { type: 'activatePremium' };

export function restaurantReducer(
  restaurant: Restaurant,
  action: RestaurantAction,
): Restaurant {
  switch (action.type) {
    case 'replace':
      return action.restaurant;
    case 'addTable':
      return {
        ...restaurant,
        nextTableId: restaurant.nextTableId + 1,
        tables: [
          ...restaurant.tables,
          { id: restaurant.nextTableId, customers: [] },
        ],
      };
    case 'removeTable':
      return {
        ...restaurant,
        tables: restaurant.tables.filter(
          table => table.id !== action.tableId || table.customers.length > 0,
        ),
      };
    case 'saveOrder': {
      if (!action.order.name.trim() || !countOrderItems(action.order.items)) {
        return restaurant;
      }
      return {
        ...restaurant,
        tables: restaurant.tables.map(table => {
          if (table.id !== action.tableId) {
            return table;
          }
          const existingOrder = table.customers.some(
            customer => customer.id === action.order.id,
          );
          const customers = existingOrder
            ? table.customers.map(customer =>
                customer.id === action.order.id ? action.order : customer,
              )
            : [...table.customers, action.order];
          return { ...table, customers };
        }),
      };
    }
    case 'finishVisit':
      return {
        ...restaurant,
        tables: restaurant.tables.map(table =>
          table.id === action.tableId
            ? {
                ...table,
                customers: table.customers.filter(
                  customer => customer.id !== action.customerId,
                ),
              }
            : table,
        ),
      };
    case 'addWaiter': {
      if (
        action.waiter.phone === restaurant.phone ||
        restaurant.waiters.some(waiter => waiter.phone === action.waiter.phone)
      ) {
        return restaurant;
      }
      return { ...restaurant, waiters: [...restaurant.waiters, action.waiter] };
    }
    case 'activatePremium':
      return { ...restaurant, isPremium: true };
  }
}
