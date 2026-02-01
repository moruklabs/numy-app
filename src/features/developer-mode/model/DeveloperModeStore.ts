import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEVELOPER_MODE_PASSWORD = "3146";
const STORAGE_KEY = "numy-developer-mode-storage";

interface DeveloperModeState {
  isDeveloperMode: boolean;
  setDeveloperMode: (value: boolean) => void;
  enableWithPassword: (password: string) => boolean;
  toggle: () => void;
  reset: () => void;
}

export const developerModeStore = create<DeveloperModeState>()(
  persist(
    (set, get) => ({
      isDeveloperMode: false,

      setDeveloperMode: (value: boolean) => {
        set({ isDeveloperMode: value });
      },

      enableWithPassword: (password: string): boolean => {
        if (password === DEVELOPER_MODE_PASSWORD) {
          set({ isDeveloperMode: true });
          return true;
        }
        return false;
      },

      toggle: () => {
        set((state) => ({ isDeveloperMode: !state.isDeveloperMode }));
      },

      reset: () => {
        set({ isDeveloperMode: false });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
