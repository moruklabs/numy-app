import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAnalyticsCollectionEnabled } from "@/infrastructure/services/AnalyticsService";
import { logger } from "@moruk/logger";

interface PrivacyState {
  analyticsEnabled: boolean;
  hasSeenPrivacyPrompt: boolean;
  _hasHydrated: boolean;

  setAnalyticsEnabled: (enabled: boolean) => void;
  setHasSeenPrivacyPrompt: (seen: boolean) => void;
  setHasHydrated: (state: boolean) => void;
}

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set, get) => ({
      analyticsEnabled: true,
      hasSeenPrivacyPrompt: false,
      _hasHydrated: false,

      setAnalyticsEnabled: async (enabled: boolean) => {
        set({ analyticsEnabled: enabled });
        // Update Firebase Analytics collection (gracefully handles errors if Firebase unavailable)
        try {
          await setAnalyticsCollectionEnabled(enabled);
        } catch (error) {
          // Firebase not available (e.g., Expo Go) - silently fail
          // The analytics service already handles this gracefully
          if (__DEV__) {
            logger.warn("[PrivacyStore] Could not update analytics collection:", error);
          }
        }
      },

      setHasSeenPrivacyPrompt: (seen: boolean) => {
        set({ hasSeenPrivacyPrompt: seen });
      },

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: "numy-privacy-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        analyticsEnabled: state.analyticsEnabled,
        hasSeenPrivacyPrompt: state.hasSeenPrivacyPrompt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
          // Sync analytics collection state on app load (gracefully handles errors if Firebase unavailable)
          setAnalyticsCollectionEnabled(state.analyticsEnabled).catch((error: unknown) => {
            // Firebase not available (e.g., Expo Go) - silently fail
            // The analytics service already handles this gracefully
            if (__DEV__) {
              logger.warn(
                "[PrivacyStore] Could not sync analytics collection on rehydrate:",
                error
              );
            }
          });
        }
      },
    }
  )
);
