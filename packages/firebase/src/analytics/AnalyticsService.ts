/**
 * AnalyticsService
 *
 * Provides analytics tracking via Firebase Analytics.
 * Implements graceful degradation if Firebase is not available.
 */

import { FIREBASE_ANALYTICS_ENABLED } from "../config";
import { logger } from "@moruk/logger";

// Type for the Analytics instance
type AnalyticsInstance = ReturnType<
  typeof import("@react-native-firebase/analytics").default
> | null;

/**
 * Firebase Analytics service implementation
 */
export class AnalyticsService {
  private analyticsInstance: AnalyticsInstance = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private consentGranted = false;

  constructor() {
    // Initialize lazily to avoid blocking app startup
    this.initializationPromise = this.initialize();
  }

  /**
   * Initialize the Analytics module and get the instance
   */
  private async initialize(): Promise<void> {
    if (!FIREBASE_ANALYTICS_ENABLED) {
      logger.info("[AnalyticsService] Analytics disabled in config");
      return;
    }

    try {
      /* istanbul ignore next -- @preserve Dynamic import cannot be tested in Jest without --experimental-vm-modules */
      const analyticsModule = await import("@react-native-firebase/analytics");
      /* istanbul ignore next -- @preserve Dynamic import success path */
      const analytics = analyticsModule.default as unknown as () => NonNullable<AnalyticsInstance>;
      this.analyticsInstance = analytics();
      /* istanbul ignore next -- @preserve Dynamic import success path */
      this.initialized = true;
      /* istanbul ignore next -- @preserve Dynamic import success path */
      logger.info("[AnalyticsService] Initialized successfully");
    } catch (error) {
      logger.error("[AnalyticsService] Failed to initialize:", error);
    }
  }

  /**
   * Ensure Analytics is initialized before use
   */
  private async ensureInitialized(): Promise<boolean> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
    return this.initialized && this.analyticsInstance !== null;
  }

  /**
   * Set user consent for analytics collection
   * This controls whether analytics events are collected and sent
   */
  async setConsent(granted: boolean): Promise<void> {
    this.consentGranted = granted;

    const ready = await this.ensureInitialized();
    /* istanbul ignore next -- @preserve SDK-dependent code path */
    if (ready && this.analyticsInstance) {
      await this.analyticsInstance.setAnalyticsCollectionEnabled(granted);
      logger.info(`[AnalyticsService] Consent ${granted ? "granted" : "revoked"}`);
    }
  }

  /**
   * Log a custom event
   */
  async logEvent(name: string, params?: Record<string, unknown>): Promise<void> {
    if (!FIREBASE_ANALYTICS_ENABLED || !this.consentGranted) {
      return;
    }

    const ready = await this.ensureInitialized();
    /* istanbul ignore next -- @preserve SDK-dependent code path */
    if (ready && this.analyticsInstance) {
      await this.analyticsInstance.logEvent(name, params);
    }
  }

  /**
   * Set the user ID for analytics
   */
  async setUserId(userId: string | null): Promise<void> {
    if (!FIREBASE_ANALYTICS_ENABLED || !this.consentGranted) {
      return;
    }

    const ready = await this.ensureInitialized();
    /* istanbul ignore next -- @preserve SDK-dependent code path */
    if (ready && this.analyticsInstance) {
      await this.analyticsInstance.setUserId(userId);
    }
  }

  /**
   * Set a user property
   */
  async setUserProperty(name: string, value: string | null): Promise<void> {
    if (!FIREBASE_ANALYTICS_ENABLED || !this.consentGranted) {
      return;
    }

    const ready = await this.ensureInitialized();
    /* istanbul ignore next -- @preserve SDK-dependent code path */
    if (ready && this.analyticsInstance) {
      await this.analyticsInstance.setUserProperty(name, value);
    }
  }

  /**
   * Log a screen view
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    if (!FIREBASE_ANALYTICS_ENABLED || !this.consentGranted) {
      return;
    }

    const ready = await this.ensureInitialized();
    /* istanbul ignore next -- @preserve SDK-dependent code path */
    if (ready && this.analyticsInstance) {
      await this.analyticsInstance.logScreenView({
        screen_name: screenName,
        screen_class: screenClass,
      });
    }
  }
}

/**
 * Singleton instance of the Analytics service
 */
let analyticsServiceInstance: AnalyticsService | null = null;

/**
 * Get or create the Analytics service singleton
 */
export function getAnalyticsService(): AnalyticsService {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new AnalyticsService();
  }
  return analyticsServiceInstance;
}

/**
 * Reset the singleton (useful for testing)
 */
export function resetAnalyticsService(): void {
  analyticsServiceInstance = null;
}
