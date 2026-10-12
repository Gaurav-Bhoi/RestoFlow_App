export type UserRole = 'owner' | 'waiter';
export type DishId = 'paneer' | 'dal' | 'roti' | 'rice' | 'naan' | 'coke';
export type MenuCategory = 'All' | 'Starters' | 'Mains' | 'Breads' | 'Drinks';
export type OrderItems = Partial<Record<DishId, number>>;

export interface Dish {
  id: DishId;
  name: string;
  description: string;
  price: number;
  category: Exclude<MenuCategory, 'All'>;
}
export interface CustomerOrder {
  id: string;
  name: string;
  items: OrderItems;
}
export interface RestaurantTable {
  id: number;
  customers: CustomerOrder[];
}
export interface Waiter {
  name: string;
  phone: string;
  photo?: string;
}
export interface Session {
  role: UserRole;
  phone: string;
  name: string;
  photo?: string;
}
export interface Restaurant {
  name: string;
  owner: string;
  phone: string;
  photo?: string;
  isPremium: boolean;
  trialStartedAt: string;
  trialEndsAt: string;
  waiters: Waiter[];
  tables: RestaurantTable[];
  nextTableId: number;
}
