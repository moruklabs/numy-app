/**
 * useConsent Hook
 *
 * Manages user consent for Firebase Analytics and Crashlytics.
 * Implements GDPR/CCPA compliant consent management with AsyncStorage persistence.
 */

import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAnalyticsService, getCrashlyticsService } from "@moruk/firebase";
import { logger } from "@moruk/logger";

const CONSENT_STORAGE_KEY = "@moruk/consent";

export interface ConsentPreferences {
  analytics: boolean;
  crashlytics: boolean;
  timestamp: number;
  version: string; // Consent version for future policy changes
}

const DEFAULT_CONSENT: ConsentPreferences = {
  analytics: false,
  crashlytics: false,
  timestamp: Date.now(),
  version: "1.0",
};

export function useConsent() {
  const [consent, setConsent] = useState<ConsentPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const applyConsent = useCallback(async (preferences: ConsentPreferences) => {
    const analytics = getAnalyticsService();
    const crashlytics = getCrashlyticsService();

    // Apply analytics consent
    await analytics.setConsent(preferences.analytics);

    // Apply crashlytics consent
    await crashlytics.setCrashlyticsCollectionEnabled(preferences.crashlytics);
  }, []);

  const loadConsent = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        const parsed: ConsentPreferences = JSON.parse(stored);
        setConsent(parsed);

        // Apply stored consent to Firebase services
        await applyConsent(parsed);
      }
    } catch (error) {
      logger.error("[useConsent] Failed to load consent:", error);
    } finally {
      setLoading(false);
    }
  }, [applyConsent]);

  // Load consent from storage on mount
  useEffect(() => {
    loadConsent();
  }, [loadConsent]);

  const grantConsent = useCallback(
    async (preferences: Partial<Pick<ConsentPreferences, "analytics" | "crashlytics">>) => {
      const newConsent: ConsentPreferences = {
        ...DEFAULT_CONSENT,
        analytics: preferences.analytics ?? DEFAULT_CONSENT.analytics,
        crashlytics: preferences.crashlytics ?? DEFAULT_CONSENT.crashlytics,
        timestamp: Date.now(),
      };

      try {
        // Save to storage
        await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newConsent));

        // Update state
        setConsent(newConsent);

        // Apply to Firebase services
        await applyConsent(newConsent);
      } catch (error) {
        logger.error("[useConsent] Failed to save consent:", error);
        throw error;
      }
    },
    [applyConsent]
  );

  const revokeConsent = useCallback(async () => {
    await grantConsent({
      analytics: false,
      crashlytics: false,
    });
  }, [grantConsent]);

  const hasConsent = consent !== null;
  const hasAnalyticsConsent = consent?.analytics ?? false;
  const hasCrashlyticsConsent = consent?.crashlytics ?? false;

  return {
    consent,
    loading,
    hasConsent,
    hasAnalyticsConsent,
    hasCrashlyticsConsent,
    grantConsent,
    revokeConsent,
  };
}
