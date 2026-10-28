export type ExpenseCategory = 'inventory' | 'miscellaneous';
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bankTransfer' | 'other';
export type ExpensePeriod =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom';

export interface ExpenseReceipt {
  uri: string;
  name: string;
  type: string;
}

export interface Expense {
  id: string;
  name: string;
  category: ExpenseCategory;
  subcategory: string;
  amountPaise: number;
  date: string;
  time: string;
  vendor: string;
  payment?: PaymentMethod;
  notes: string;
  receipt?: ExpenseReceipt;
}

export interface ExpenseFilters {
  period: ExpensePeriod;
  from: string;
  to: string;
  category: ExpenseCategory | 'all';
  payment: PaymentMethod | 'all';
  min: string;
  max: string;
}

export const inventorySubcategories = [
  'chicken',
  'meat',
  'fish',
  'vegetables',
  'fruits',
  'rice',
  'flour',
  'oil',
  'spices',
  'dairy',
  'beverages',
  'packaging',
] as const;
export const miscellaneousSubcategories = [
  'employeeSalary',
  'restaurantRent',
  'electricity',
  'water',
  'internet',
  'equipmentMaintenance',
  'cleaning',
  'repairs',
  'transportation',
  'marketing',
  'softwareSubscriptions',
  'other',
] as const;
export const paymentMethods: PaymentMethod[] = [
  'cash',
  'upi',
  'card',
  'bankTransfer',
  'other',
];
export const expensePeriods: ExpensePeriod[] = [
  'today',
  'yesterday',
  'thisWeek',
  'thisMonth',
  'lastMonth',
  'custom',
];
