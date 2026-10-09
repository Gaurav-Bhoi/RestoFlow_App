import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Restaurant } from '../../features/restaurant/types';

const RESTAURANT_STORAGE_KEY = 'restoflow.restaurant.v1';
export async function loadRestaurant(): Promise<Restaurant | null> {
  const stored = await AsyncStorage.getItem(RESTAURANT_STORAGE_KEY);
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
  return restaurant;
}
export const saveRestaurant = (restaurant: Restaurant) =>
  AsyncStorage.setItem(RESTAURANT_STORAGE_KEY, JSON.stringify(restaurant));
