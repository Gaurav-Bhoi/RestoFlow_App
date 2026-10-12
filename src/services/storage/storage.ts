import { getAppStorage } from './mmkv';

// Non-secret local data only. MMKV is synchronous; clearing affects this namespace.
export const storage = {
  getString: (key: string) => getAppStorage().getString(key),
  setString: (key: string, value: string) => getAppStorage().set(key, value),
  getBoolean: (key: string) => getAppStorage().getBoolean(key),
  setBoolean: (key: string, value: boolean) => getAppStorage().set(key, value),
  getNumber: (key: string) => getAppStorage().getNumber(key),
  setNumber: (key: string, value: number) => getAppStorage().set(key, value),
  getObject<T>(key: string): T | undefined {
    const value = getAppStorage().getString(key);
    if (value === undefined) return undefined;
    // Invalid persisted JSON is a recoverable cache miss.
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  },
  setObject<T>(key: string, value: T) {
    const encoded = JSON.stringify(value);
    if (encoded === undefined)
      throw new Error('Value is not JSON serializable');
    getAppStorage().set(key, encoded);
  },
  contains: (key: string) => getAppStorage().contains(key),
  remove: (key: string) => getAppStorage().remove(key),
  clear: () => getAppStorage().clearAll(),
};
