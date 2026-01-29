/**
 * CrashlyticsService
 *
 * Provides crash reporting and error logging via Firebase Crashlytics.
 * Implements graceful degradation if Firebase is not available.
 */

import { FIREBASE_CRASHLYTICS_ENABLED } from "../config";
import { logger } from "@moruk/logger";

// Type for the Crashlytics instance
type CrashlyticsInstance = ReturnType<
  typeof import("@react-native-firebase/crashlytics").default
> | null;

/**
 * Firebase Crashlytics service implementation
 */
export class CrashlyticsService {
  private crashlyticsInstance: CrashlyticsInstance = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Initialize lazily to avoid blocking app startup
    this.initializationPromise = this.initialize();
  }

  /**
   * Initialize the Crashlytics module and get the instance
   */
  private async initialize(): Promise<void> {
    if (!FIREBASE_CRASHLYTICS_ENABLED) {
      logger.info("[CrashlyticsService] Crashlytics disabled in config");
      return;
    }

    try {
      /* istanbul ignore next -- @preserve Dynamic import cannot be tested in Jest without --experimental-vm-modules */
      const crashlyticsModule = await import("@react-native-firebase/crashlytics");
      /* istanbul ignore next -- @preserve Dynamic import success path */
      // Get the Crashlytics instance once during initialization
      // Type assertion needed because dynamic import doesn't preserve callable signature
      const crashlytics =
        crashlyticsModule.default as unknown as () => NonNullable<CrashlyticsInstance>;
      this.crashlyticsInstance = crashlytics();
      /* istanbul ignore next -- @preserve Dynamic import success path */
      this.initialized = true;
      /* istanbul ignore next -- @preserve Dynamic import success path */
      logger.info("[CrashlyticsService] Initialized successfully");
    } catch (error) {
      logger.error("[CrashlyticsService] Failed to initialize:", error);
    }
  }

  /**
   * Ensure Crashlytics is initialized before use
   */
  private async ensureInitialized(): Promise<boolean> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
    return this.initialized && this.crashlyticsInstance !== null;
  }

  /**
   * Log a message to Crashlytics
   * Messages appear in the Crashlytics console when a crash occurs
   */
  log(message: string): void {
    if (!FIREBASE_CRASHLYTICS_ENABLED) {
      return;
    }

    this.ensureInitialized().then((ready) => {
      /* istanbul ignore next -- @preserve SDK-dependent code path */
      if (ready && this.crashlyticsInstance) {
        this.crashlyticsInstance.log(message);
      }
    });
  }

  /**
   * Record a non-fatal error
   * These appear in the Crashlytics console without causing an app crash
   */
  recordError(error: Error): void {
    if (!FIREBASE_CRASHLYTICS_ENABLED) {
      logger.error("[CrashlyticsService] Error (not reported):", error);
      return;
    }

    this.ensureInitialized().then((ready) => {
      /* istanbul ignore next -- @preserve SDK-dependent code path */
      if (ready && this.crashlyticsInstance) {
        this.crashlyticsInstance.recordError(error);
        logger.info("[CrashlyticsService] Error recorded:", error.message);
      }
    });
  }

  /**
   * Set the user identifier for crash reports
   */
  setUserId(userId: string): void {
    if (!FIREBASE_CRASHLYTICS_ENABLED) {
      return;
    }

    this.ensureInitialized().then((ready) => {
      /* istanbul ignore next -- @preserve SDK-dependent code path */
      if (ready && this.crashlyticsInstance) {
        this.crashlyticsInstance.setUserId(userId);
      }
    });
  }

  /**
   * Set a custom key-value attribute
   */
  setAttribute(key: string, value: string): void {
    if (!FIREBASE_CRASHLYTICS_ENABLED) {
      return;
    }

    this.ensureInitialized().then((ready) => {
      /* istanbul ignore next -- @preserve SDK-dependent code path */
      if (ready && this.crashlyticsInstance) {
        this.crashlyticsInstance.setAttribute(key, value);
      }
    });
  }

  /**
   * Set multiple custom attributes at once
   */
  setAttributes(attributes: Record<string, string>): void {
    if (!FIREBASE_CRASHLYTICS_ENABLED) {
      return;
    }

    this.ensureInitialized().then((ready) => {
      /* istanbul ignore next -- @preserve SDK-dependent code path */
      if (ready && this.crashlyticsInstance) {
        this.crashlyticsInstance.setAttributes(attributes);
      }
    });
  }

  /**
   * Force a test crash (for testing Crashlytics integration)
   * WARNING: This will crash the app!
   */
  crash(): void {
    if (!FIREBASE_CRASHLYTICS_ENABLED) {
      logger.warn("[CrashlyticsService] Cannot crash - Crashlytics disabled in config");
      return;
    }

    this.ensureInitialized().then((ready) => {
      /* istanbul ignore next -- @preserve SDK-dependent code path */
      if (ready && this.crashlyticsInstance) {
        logger.info("[CrashlyticsService] Triggering test crash...");
        this.crashlyticsInstance.crash();
      }
    });
  }

  /**
   * Check if Crashlytics collection is enabled
   */
  async isCrashlyticsCollectionEnabled(): Promise<boolean> {
    const ready = await this.ensureInitialized();
    if (!ready || !this.crashlyticsInstance) {
      return false;
    }
    /* istanbul ignore next -- @preserve SDK-dependent code path */
    return this.crashlyticsInstance.isCrashlyticsCollectionEnabled;
  }

  /**
   * Enable or disable Crashlytics collection
   * Useful for respecting user privacy preferences
   */
  async setCrashlyticsCollectionEnabled(enabled: boolean): Promise<void> {
    const ready = await this.ensureInitialized();
    /* istanbul ignore next -- @preserve SDK-dependent code path */
    if (ready && this.crashlyticsInstance) {
      await this.crashlyticsInstance.setCrashlyticsCollectionEnabled(enabled);
      logger.info(`[CrashlyticsService] Collection ${enabled ? "enabled" : "disabled"}`);
    }
  }
}

/**
 * Singleton instance of the Crashlytics service
 */
let crashlyticsServiceInstance: CrashlyticsService | null = null;

/**
 * Get or create the Crashlytics service singleton
 */
export function getCrashlyticsService(): CrashlyticsService {
  if (!crashlyticsServiceInstance) {
    crashlyticsServiceInstance = new CrashlyticsService();
  }
  return crashlyticsServiceInstance;
}

/**
 * Reset the singleton (useful for testing)
 */
export function resetCrashlyticsService(): void {
  crashlyticsServiceInstance = null;
}
