import type { AnimationTokens, ColorUtilsContract } from "@moruk/hooks";

export const ANIMATION_CONFIG: AnimationTokens = {
  duration: {
    fast: 150,
    normal: 220,
    slow: 320,
    verySlow: 450,
    pageTransition: 300,
  },
  delay: {
    none: 0,
    short: 75,
    medium: 150,
    long: 300,
    veryLong: 600,
  },
};

export const colorUtils: ColorUtilsContract = {
  getBackground: (isDark) => (isDark ? "#020617" : "#F9FAFB"),
  getSurface: (isDark) => (isDark ? "#0F172A" : "#FFFFFF"),
  getText: (isDark) => (isDark ? "#E5E7EB" : "#020617"),
  getTextMuted: (isDark) => (isDark ? "#9CA3AF" : "#6B7280"),
  getBorder: (isDark) => (isDark ? "#334155" : "#E5E7EB"),
};
