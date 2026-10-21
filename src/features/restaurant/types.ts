import type {
  ApiOrderItem,
  Dashboard,
  RestaurantSummary,
  Subscription,
} from '../../api/types';
export type UserRole = 'owner' | 'waiter';
export type DishId = string;
export type MenuCategory = string;
export type OrderItems = Record<DishId, number>;
export interface ProfilePhoto {
  uri: string;
  type: 'image/jpeg' | 'image/png' | 'image/webp';
  name: string;
}
export interface Dish {
  id: DishId;
  name: string;
  description: string;
  price: number;
  category: string;
  foodType: 'VEG' | 'NON_VEG';
  available: boolean;
  imageUrl?: string;
}
export interface CustomerOrder {
  id: string;
  name: string;
  items: ApiOrderItem[];
  itemCount: number;
  total: string;
  createdAt: string;
}
export interface RestaurantTable {
  id: string;
  number: number;
  customers: CustomerOrder[];
  occupied: boolean;
  guestCount: number;
}
export interface Waiter {
  id: string;
  name: string;
  phone: string;
  photo?: string;
}
export interface Session {
  userId: string;
  restaurantId: string;
  restaurants: RestaurantSummary[];
  role: UserRole;
  phone: string;
  name: string;
  photo?: string;
}
export interface Restaurant {
  id: string;
  name: string;
  owner: string;
  phone: string;
  photo?: string;
  isPremium: boolean;
  trialStartedAt: string;
  trialEndsAt: string;
  subscription: Subscription;
  waiters: Waiter[];
  tables: RestaurantTable[];
  menu: Dish[];
  dashboard: Dashboard | null;
}
