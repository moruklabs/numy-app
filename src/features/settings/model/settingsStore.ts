import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { SupportedLanguage } from "@/i18n";

interface SettingsState {
  themeMode: "light" | "dark" | "system";
  reduceMotion: boolean;
  language: SupportedLanguage | null; // null means system default
  setThemeMode: (mode: "light" | "dark" | "system") => void;
  toggleReduceMotion: () => void;
  setLanguage: (lang: SupportedLanguage | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: "system",
      reduceMotion: false,
      language: null,
      setThemeMode: (mode) => set({ themeMode: mode }),
      toggleReduceMotion: () => set((state) => ({ reduceMotion: !state.reduceMotion })),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
