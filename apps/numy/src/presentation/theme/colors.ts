// Numy Color System - Based on PRD Design Specs

export const colors = {
  // Background colors
  background: {
    primary: "#1a1a1a",
    secondary: "#252525",
    tertiary: "#2d2d2d",
  },

  // Text colors
  // WCAG AA requires 4.5:1 contrast for normal text
  // On #1a1a1a background: #ffffff = 16.1:1, #a0a0a0 = 5.1:1, #8a8a8a = 4.5:1
  text: {
    primary: "#ffffff",
    secondary: "#a0a0a0",
    muted: "#8a8a8a", // Updated from #666666 to meet WCAG AA 4.5:1 contrast
  },

  // Result colors
  result: {
    primary: "#7fff00", // Bright green for results
    error: "#ff4444",
  },

  // Category colors (from design mockups)
  categories: {
    myCalculations: {
      accent: "#ffd700", // Yellow
      text: "#ffd700",
      border: "#ffd700",
    },
    unitConversion: {
      accent: "#00bcd4", // Cyan
      text: "#00bcd4",
      border: "#00bcd4",
    },
    functions: {
      accent: "#9c27b0", // Purple
      text: "#9c27b0",
      border: "#9c27b0",
    },
    variables: {
      accent: "#4caf50", // Green
      text: "#4caf50",
      border: "#4caf50",
    },
    cssCalculations: {
      accent: "#ff9800", // Orange
      text: "#ff9800",
      border: "#ff9800",
    },
    comment: {
      accent: "#8a8a8a", // Gray - updated to meet WCAG AA contrast
      text: "#8a8a8a",
      border: "#8a8a8a",
    },
  },

  // UI elements
  ui: {
    border: "#333333",
    divider: "#2a2a2a",
    highlight: "#3a3a3a",
  },

  // Currency highlight
  currency: {
    dollar: "#ffd700",
    euro: "#4caf50",
    pound: "#00bcd4",
  },
} as const;

export type CategoryKey = keyof typeof colors.categories;
