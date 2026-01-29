import { storage } from "@moruk/storage";
import * as Crypto from "expo-crypto";
import * as Localization from "expo-localization";
import { logger } from "@moruk/logger";

export interface UserPreferences {
  language: string;
  theme: "light" | "dark" | "system";
  notifications: boolean;
  analytics: boolean;
  lastAppVersion?: string;
  onboardingCompleted: boolean;
  firstLaunch: boolean;
}

export interface UserSession {
  sessionId: string;
  userId?: string;
  isAuthenticated: boolean;
  loginTimestamp?: number;
  lastActiveTimestamp: number;
}

export interface LocalizationInfo {
  locale: string;
  locales: string[];
  currency?: string;
  region?: string;
}

// User Preferences Management
export const getUserPreferences = async (): Promise<UserPreferences> => {
  try {
    const prefs = await storage.getItem<UserPreferences>("userPreferences");
    const language = Localization.getLocales()?.[0]?.languageCode || "en";

    const defaultPrefs: UserPreferences = {
      language: language || "en",
      theme: "system",
      notifications: true,
      analytics: true,
      onboardingCompleted: false,
      firstLaunch: true,
    };

    return prefs ? { ...defaultPrefs, ...prefs } : defaultPrefs;
  } catch (error) {
    logger.warn("Error getting user preferences:", error);
    return {
      language: "en",
      theme: "system",
      notifications: true,
      analytics: true,
      onboardingCompleted: false,
      firstLaunch: true,
    };
  }
};

export const setUserPreferences = async (preferences: Partial<UserPreferences>): Promise<void> => {
  try {
    const currentPrefs = await getUserPreferences();
    const updatedPrefs = { ...currentPrefs, ...preferences };
    await storage.setItem("userPreferences", updatedPrefs);
  } catch (error) {
    logger.warn("Error saving user preferences:", error);
  }
};

export const getUserSession = async (): Promise<UserSession | null> => {
  try {
    return await storage.getItem<UserSession>("userSession");
  } catch (error) {
    logger.warn("Error getting user session:", error);
    return null;
  }
};

// Localization Information
export const getLocalizationInfo = (): LocalizationInfo => {
  try {
    const locales = Localization.getLocales();
    const primaryLocale = locales?.[0];

    return {
      locale: primaryLocale?.languageCode || "en",
      locales: locales
        ?.map((locale: any) => locale.languageCode)
        .filter((code: any): code is string => code !== null) || ["en"],
      currency: primaryLocale?.currencyCode || undefined,
      region: primaryLocale?.regionCode || undefined,
    };
  } catch (error) {
    logger.warn("Error getting localization info:", error);
    return {
      locale: "en",
      locales: ["en"],
      currency: undefined,
      region: undefined,
    };
  }
};

// Device Language Detection
export const getDeviceLanguage = (): string => {
  try {
    const locales = Localization.getLocales();
    const primaryLocale = locales?.[0];
    const deviceLanguage = primaryLocale?.languageCode || "en";

    // Map device language to supported languages
    const supportedLanguages = ["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko", "tr"];
    return supportedLanguages.includes(deviceLanguage) ? deviceLanguage : "en";
  } catch (error) {
    logger.warn("Error getting device language:", error);
    return "en";
  }
};

// Check if language is supported
export const isLanguageSupported = (language: string): boolean => {
  const supportedLanguages = ["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko", "tr"];
  return supportedLanguages.includes(language);
};

// User ID Management
const DEVICE_ID_KEY = "@device_id";

/**
 * Gets or creates a persistent user ID (UUID).
 * Checks storage for existing ID, generates new one if not found.
 * Falls back to session-only UUID if storage fails.
 *
 * @returns The user ID string
 */
export const getUserOrCreateUserId = async (): Promise<string> => {
  try {
    const existingId = await storage.getItem<string>(DEVICE_ID_KEY);
    if (existingId) {
      if (__DEV__) {
        logger.info("[getUserOrCreateUserId] Loaded existing user ID:", existingId);
      }
      return existingId;
    }

    // Generate new UUID
    const newId = Crypto.randomUUID();
    await storage.setItem(DEVICE_ID_KEY, newId);
    if (__DEV__) {
      logger.info("[getUserOrCreateUserId] Generated new user ID:", newId);
    }
    return newId;
  } catch (error) {
    logger.warn("[getUserOrCreateUserId] Failed to get/create user ID from storage:", error);
    // Fallback to a session-only UUID if storage fails
    const fallbackId = Crypto.randomUUID();
    if (__DEV__) {
      logger.info("[getUserOrCreateUserId] Using fallback session-only UUID:", fallbackId);
    }
    return fallbackId;
  }
};
