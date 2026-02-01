/**
 * Firebase Configuration
 */

// Enable/disable Firebase services based on environment
export const FIREBASE_CRASHLYTICS_ENABLED = true;
export const FIREBASE_ANALYTICS_ENABLED = true;
export const FIREBASE_REMOTE_CONFIG_ENABLED = true;

/**
 * Firebase Analytics Configuration
 */
export interface AnalyticsConfig {
  enabled: boolean;
  debugMode: boolean;
}

export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enabled: FIREBASE_ANALYTICS_ENABLED,
  debugMode: typeof __DEV__ !== "undefined" ? __DEV__ : false,
};
