const RESTAURANT_STORAGE_KEY = 'restoflow.restaurant.v1';
import type { LocalizationStorage } from '../types';
import { TranslationCache } from './translationCache';

// One-time compatibility with the app's previous three-name restaurant setting.
// This historical mapping never determines current language availability.
export async function migrateLegacyPreference(
  storage: LocalizationStorage,
  cache: TranslationCache,
) {
  try {
    if (await cache.selected()) return;
    const raw = await storage.getItem(RESTAURANT_STORAGE_KEY);
    if (!raw) return;
    const previous = JSON.parse(raw).language;
    const codes = new Map([
      ['English', 'en'],
      ['Marathi', 'mr'],
      ['Hindi', 'hi'],
    ]);
    const code = codes.get(previous);
    if (code) await cache.select(code, code === 'hi' ? 'argos' : 'bundled');
  } catch {
    // Unreadable old data must never prevent local English startup.
  }
}
