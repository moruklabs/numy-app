import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface OnboardingState {
  hasSeenOnboarding: boolean;
  userGoal: string | null;
  completeOnboarding: () => void;
  setUserGoal: (goal: string) => void;
  reset: () => void;
}

export const useOnboardingState = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      userGoal: null,
      completeOnboarding: () => set({ hasSeenOnboarding: true }),
      setUserGoal: (goal) => set({ userGoal: goal }),
      reset: () => set({ hasSeenOnboarding: false, userGoal: null }),
    }),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
