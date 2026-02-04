import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingsState {
  themeMode: "light" | "dark" | "system";
  reduceMotion: boolean;
  setThemeMode: (mode: "light" | "dark" | "system") => void;
  toggleReduceMotion: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: "system",
      reduceMotion: false,
      setThemeMode: (mode) => set({ themeMode: mode }),
      toggleReduceMotion: () => set((state) => ({ reduceMotion: !state.reduceMotion })),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
