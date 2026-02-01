import {
  getDeviceLanguage,
  getUserPreferences,
  isLanguageSupported,
  setUserPreferences,
} from "@moruk/info";
import { logger } from "@moruk/logger";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = string;

type TranslationsType = Record<string, any>;

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  getLanguage: () => Promise<Language>;
  getCurrentLanguageFromPreferences: () => Promise<Language>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps<T extends TranslationsType> {
  children: React.ReactNode;
  translations: T;
}

export function LanguageProvider<T extends TranslationsType>({
  children,
  translations,
}: LanguageProviderProps<T>) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    // Load saved language preference or use device language
    const loadLanguage = async () => {
      try {
        // First, try to get saved language preference
        const savedLanguage = await AsyncStorage.getItem("language");

        if (savedLanguage && savedLanguage in translations) {
          // User has previously set a language preference
          setLanguageState(savedLanguage as Language);
        } else {
          // First time opening app - use device language
          const deviceLanguage = getDeviceLanguage();
          const supportedLanguage =
            isLanguageSupported(deviceLanguage) && deviceLanguage in translations
              ? (deviceLanguage as Language)
              : "en";

          // Save the device language as initial preference
          await AsyncStorage.setItem("language", supportedLanguage);
          setLanguageState(supportedLanguage);

          // Update user preferences to track first launch
          const userPrefs = await getUserPreferences();
          if (userPrefs.firstLaunch) {
            await setUserPreferences({
              ...userPrefs,
              language: supportedLanguage,
              firstLaunch: false,
            });
          }
        }
      } catch (error) {
        logger.error("Error loading language preference:", error);
        // Fallback to English
        setLanguageState("en");
      }
    };
    loadLanguage();
  }, [translations]);

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem("language", lang);
      setLanguageState(lang);

      // Update user preferences to track language changes
      const userPrefs = await getUserPreferences();
      await setUserPreferences({
        ...userPrefs,
        language: lang,
      });
    } catch (error) {
      logger.error("Error saving language preference:", error);
    }
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    const keys = key.split(".");

    // Helper function to resolve a key path in a translation object
    const resolveKey = (translationObj: any): string | null => {
      let value: any = translationObj;

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          return null; // Key not found
        }
      }

      if (typeof value === "string") {
        return value;
      }

      return null; // Value is not a string
    };

    // First, try to find the key in the current language
    const currentLangTranslations = translations[language] || "en";
    let value = currentLangTranslations ? resolveKey(currentLangTranslations) : null;

    // If not found and current language is not English, try English fallback
    if (value === null && language !== "en" && translations.en) {
      value = resolveKey(translations.en);
    }

    // If still not found, return the key
    if (value === null) {
      return key;
    }

    // Replace parameters in the translation string
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match: string, paramKey: string) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  };

  const getLanguage = async () => {
    return language;
  };

  const getCurrentLanguageFromPreferences = async (): Promise<Language> => {
    try {
      const userPrefs = await getUserPreferences();
      return isLanguageSupported(userPrefs.language) ? (userPrefs.language as Language) : "en";
    } catch (error) {
      logger.error("Error getting language from preferences:", error);
      return "en";
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        getLanguage,
        getCurrentLanguageFromPreferences,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
