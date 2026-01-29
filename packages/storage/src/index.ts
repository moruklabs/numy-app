import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "@moruk/logger";

/**
 * A wrapper around @react-native-async-storage/async-storage that provides
 * a simpler API with automatic JSON serialization/deserialization.
 */
export const storage = {
  /**
   * Retrieves a value from storage and parses it as JSON.
   * @param key The key to retrieve
   * @returns The parsed value or null if not found or on error
   */
  getItem: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`[Storage] Error getting item ${key}:`, error);
      return null;
    }
  },

  /**
   * Stringifies a value and saves it to storage.
   * @param key The key to save under
   * @param value The value to save
   */
  setItem: async <T>(key: string, value: T): Promise<void> => {
    try {
      const stringValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
      logger.error(`[Storage] Error setting item ${key}:`, error);
    }
  },

  /**
   * Removes an item from storage.
   * @param key The key to remove
   */
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      logger.error(`[Storage] Error removing item ${key}:`, error);
    }
  },

  /**
   * Clears all items from storage.
   */
  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      logger.error(`[Storage] Error clearing storage:`, error);
    }
  },

  /**
   * Gets all keys from storage.
   */
  getAllKeys: async (): Promise<readonly string[]> => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      logger.error("[Storage] Error getting all keys:", error);
      return [];
    }
  },

  /**
   * Multi-get items from storage.
   */
  multiGet: async (keys: string[]): Promise<[string, any][]> => {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      return pairs.map(([key, value]) => [key, value ? JSON.parse(value) : null]);
    } catch (error) {
      logger.error("[Storage] Error in multiGet:", error);
      return [];
    }
  },

  /**
   * Multi-set items in storage.
   */
  multiSet: async (keyValuePairs: [string, any][]): Promise<void> => {
    try {
      const stringPairs: [string, string][] = keyValuePairs.map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);
      await AsyncStorage.multiSet(stringPairs);
    } catch (error) {
      logger.error("[Storage] Error in multiSet:", error);
    }
  },

  /**
   * Multi-remove items from storage.
   */
  multiRemove: async (keys: string[]): Promise<void> => {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      logger.error("[Storage] Error in multiRemove:", error);
    }
  },
};

export default storage;
