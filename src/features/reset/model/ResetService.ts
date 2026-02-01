import AsyncStorage from "@react-native-async-storage/async-storage";
import { AdsConsent } from "react-native-google-mobile-ads";
import * as Updates from "expo-updates";
import { logger } from "@moruk/logger";

/**
 * ResetService - Orchestrates global app reset operations
 *
 * Performs a complete nuclear reset:
 * 1. Clears all AsyncStorage data
 * 2. Resets UMP/AdMob consent
 * 3. Reloads the app to start fresh
 */
export class ResetService {
  /**
   * Perform a complete app reset
   * This is a destructive operation that clears all user data
   */
  static async performGlobalReset(): Promise<void> {
    try {
      // Step 1: Clear all AsyncStorage
      await AsyncStorage.clear();

      // Step 2: Reset UMP consent
      await AdsConsent.reset();

      // Step 3: Force app reload to start fresh
      await Updates.reloadAsync();
    } catch (error) {
      logger.error("[ResetService] Global reset failed:", error);
      throw error;
    }
  }
}
