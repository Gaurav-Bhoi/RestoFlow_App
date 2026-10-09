import { createDemoRestaurant } from '../src/features/restaurant/demoData';
import { restaurantReducer } from '../src/features/restaurant/restaurantReducer';
import {
  calculateOrderTotal,
  changeQuantity,
  countOrderItems,
} from '../src/features/orders/orderCalculations';
import { filterMenu } from '../src/features/menu/menuData';
import { isValidPhone } from '../src/features/auth/validation';
import { trialDaysRemaining } from '../src/utils/date';
import { createReceiptHtml } from '../src/features/billing/receiptPrinting';

test('each guest has an independent total and completing Rahul leaves Amit active', () => {
  const restaurant = createDemoRestaurant();
  const [rahul, amit] = restaurant.tables[0].customers;
  expect(calculateOrderTotal(rahul.items)).toBe(420);
  expect(calculateOrderTotal(amit.items)).toBe(430);
  const updated = restaurantReducer(restaurant, {
    type: 'finishVisit',
    tableId: 1,
    customerId: 'rahul',
  });
  expect(updated.tables[0].customers).toEqual([amit]);
  expect(restaurant.tables[0].customers).toHaveLength(2);
});
test('saving or editing one order preserves the other guests and tables', () => {
  const restaurant = createDemoRestaurant();
  const priya = { id: 'priya', name: 'Priya', items: { dal: 1, roti: 4 } };
  const withPriya = restaurantReducer(restaurant, {
    type: 'saveOrder',
    tableId: 1,
    order: priya,
  });
  const updated = restaurantReducer(withPriya, {
    type: 'saveOrder',
    tableId: 1,
    order: { ...priya, items: { roti: 2 } },
  });
  expect(updated.tables[0].customers).toHaveLength(3);
  expect(updated.tables[0].customers.slice(0, 2)).toEqual(
    restaurant.tables[0].customers,
  );
  expect(calculateOrderTotal(updated.tables[0].customers[2].items)).toBe(60);
  expect(updated.tables.slice(1)).toEqual(restaurant.tables.slice(1));
});
test('an occupied table cannot be removed and table numbers are never reused', () => {
  let restaurant = createDemoRestaurant();
  restaurant = restaurantReducer(restaurant, {
    type: 'removeTable',
    tableId: 1,
  });
  expect(restaurant.tables).toHaveLength(4);
  restaurant = restaurantReducer(restaurant, {
    type: 'removeTable',
    tableId: 4,
  });
  restaurant = restaurantReducer(restaurant, { type: 'addTable' });
  expect(restaurant.tables.map(table => table.id)).toEqual([1, 2, 3, 5]);
});
test('quantities stop at zero and the sample Priya order costs ₹300', () => {
  const original = { dal: 1, roti: 3 };
  const added = changeQuantity(original, 'roti', 1);
  expect(countOrderItems(added)).toBe(5);
  expect(calculateOrderTotal(added)).toBe(300);
  expect(changeQuantity(changeQuantity({}, 'dal', 1), 'dal', -2)).toEqual({});
  expect(original.roti).toBe(3);
});
test('blank or empty orders cannot be stored', () => {
  const restaurant = createDemoRestaurant();
  expect(
    restaurantReducer(restaurant, {
      type: 'saveOrder',
      tableId: 1,
      order: { id: 'empty', name: '', items: { dal: 1 } },
    }),
  ).toBe(restaurant);
  expect(
    restaurantReducer(restaurant, {
      type: 'saveOrder',
      tableId: 1,
      order: { id: 'empty', name: 'Guest', items: {} },
    }),
  ).toBe(restaurant);
});
test('duplicate waiter numbers and the owner number cannot be added', () => {
  const restaurant = createDemoRestaurant();
  for (const phone of ['9876543210', '9876543211']) {
    expect(
      restaurantReducer(restaurant, {
        type: 'addWaiter',
        waiter: { name: 'Duplicate', phone },
      }),
    ).toBe(restaurant);
  }
});
test('menu search combines category and a case insensitive query', () => {
  expect(filterMenu(' DAL ', 'Mains').map(dish => dish.id)).toEqual(['dal']);
  expect(filterMenu('dal', 'Drinks')).toEqual([]);
  expect(filterMenu('', 'Breads')).toHaveLength(2);
});
test('mobile numbers follow the reference’s Indian phone validation', () => {
  expect(isValidPhone('9876543210')).toBe(true);
  expect(isValidPhone('1234567890')).toBe(false);
  expect(isValidPhone('987')).toBe(false);
});
test('trial days reach zero at expiry and premium activation retains restaurant data', () => {
  expect(
    trialDaysRemaining(
      '2026-10-17T00:00:00+05:30',
      new Date('2026-10-17T00:00:00+05:30'),
    ),
  ).toBe(0);
  const restaurant = createDemoRestaurant();
  const updated = restaurantReducer(restaurant, { type: 'activatePremium' });
  expect(updated.isPremium).toBe(true);
  expect(updated.tables).toEqual(restaurant.tables);
});
test('printed receipts escape entered names and include only the selected order', () => {
  const order = {
    ...createDemoRestaurant().tables[0].customers[0],
    name: '<script>Rahul</script>',
  };
  const html = createReceiptHtml(
    'Kitchen & Co',
    1,
    order,
    new Date('2026-10-09T12:30:00+05:30'),
  );
  expect(html).toContain('&lt;script&gt;Rahul&lt;/script&gt;');
  expect(html).toContain('Kitchen &amp; Co');
  expect(html).toContain('₹420');
  expect(html).not.toContain('Paneer Tikka');
});
