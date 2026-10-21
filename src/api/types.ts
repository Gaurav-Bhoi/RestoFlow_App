export interface ApiError {
  status?: number;
  code: string;
  message: string;
  data?: unknown;
}
export interface Subscription {
  plan: 'FREE_TRIAL' | 'LIFETIME';
  state: 'FREE_TRIAL_ACTIVE' | 'FREE_TRIAL_EXPIRED' | 'LIFETIME_ACTIVE';
  isActive: boolean;
  trialStartedAt: string;
  trialEndsAt: string;
  lifetimeGrantedAt: string | null;
}
export interface ApiUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  profileImageUrl: string | null;
}
export interface RestaurantSummary {
  id: string;
  name: string;
  role: 'OWNER' | 'WAITER';
  subscription: Subscription;
}
export interface AccountProfile {
  user: ApiUser;
  restaurants: RestaurantSummary[];
}
export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
}
export type AuthResult = AccountProfile & AuthTokens;
export interface OtpChallenge {
  challengeId: string;
  expiresIn: number;
  resendAfter: number;
  mockCode?: string;
}
export interface ApiDish {
  id: string;
  name: string;
  description: string | null;
  category: string;
  foodType: 'VEG' | 'NON_VEG';
  available: boolean;
  price: string;
  imageUrl: string | null;
}
export interface ApiWaiter {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  profileImageUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}
export interface ApiTable {
  id: string;
  tableNumber: number;
  name: string;
  occupied: boolean;
  openOrderCount: number;
}
export interface ApiOrderItem {
  id: string;
  dishId: string | null;
  name: string;
  quantity: number;
  note: string | null;
  unitPrice: string;
  lineTotal: string;
}
export interface ApiOrderSummary {
  id: string;
  tableId: string;
  customerName: string | null;
  closedAt: string | null;
  itemCount: number;
  total: string;
  currency: 'INR';
  createdAt: string;
}
export interface ApiOrder extends ApiOrderSummary {
  items: ApiOrderItem[];
  table: { id: string; name: string };
  subtotal: string;
}
export interface ApiBill {
  orderId: string;
  customerName: string | null;
  table: { id: string; name: string };
  items: Omit<ApiOrderItem, 'id' | 'dishId'>[];
  subtotal: string;
  total: string;
  currency: 'INR';
}
export interface Dashboard {
  totalTables: number;
  occupiedTables: number;
  availableTables: number;
  guestCount: number;
  openOrderTotal: string;
  currency: 'INR';
}
