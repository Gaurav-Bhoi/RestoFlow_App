import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Restaurant } from '../../features/restaurant/types';
import { storage } from './storage';
import { STORAGE_KEYS } from './storageKeys';

export const RESTAURANT_STORAGE_KEY = STORAGE_KEYS.RESTAURANT;
export async function loadRestaurant(): Promise<Restaurant | null> {
  const cached = storage.getString(RESTAURANT_STORAGE_KEY);
  const stored = cached ?? (await AsyncStorage.getItem(RESTAURANT_STORAGE_KEY));
  if (!stored) {
    return null;
  }
  const restaurant: Restaurant = JSON.parse(stored);
  if (
    !Array.isArray(restaurant.tables) ||
    !Array.isArray(restaurant.waiters) ||
    !restaurant.phone ||
    !restaurant.trialEndsAt
  ) {
    throw new Error('Invalid saved restaurant');
  }
  if (cached === undefined) {
    // Migrate once, then remove the stale copy only after a successful write.
    storage.setString(RESTAURANT_STORAGE_KEY, stored);
    await AsyncStorage.removeItem(RESTAURANT_STORAGE_KEY);
  }
  return restaurant;
}
export function saveRestaurant(restaurant: Restaurant) {
  storage.setObject(RESTAURANT_STORAGE_KEY, restaurant);
}
