import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@komplekku_cache:';

export const CACHE_KEYS = {
  COMPLEX_SETTINGS: 'complex_settings',
  HOUSEHOLD: 'household',
  ACTIVE_ROLE: 'active_role',
  ANNOUNCEMENTS: 'announcements',
  EMERGENCY_CONTACTS: 'emergency_contacts',
  MY_DUES: 'my_dues',
};

/**
 * Cache data to AsyncStorage with timestamp
 */
export async function setCachedData<T>(key: string, data: T): Promise<void> {
  try {
    const payload = {
      cachedAt: Date.now(),
      data,
    };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(payload));
  } catch (e) {
    console.warn(`Failed to cache data for key ${key}:`, e);
  }
}

/**
 * Retrieve cached data from AsyncStorage
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data as T;
  } catch (e) {
    console.warn(`Failed to read cache for key ${key}:`, e);
    return null;
  }
}

/**
 * Remove cached item
 */
export async function clearCachedData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (e) {
    console.warn(`Failed to clear cache for key ${key}:`, e);
  }
}
