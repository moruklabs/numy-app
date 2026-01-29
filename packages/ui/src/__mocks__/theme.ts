/**
 * Mock Theme for Testing
 *
 * This mock theme provides consistent values for unit tests.
 * Uses neutral colors to avoid app-specific styling in tests.
 */
import { Theme } from "@moruk/context";

export const mockTheme: Theme = {
  colors: {
    // Primary colors
    primary: "#7C3AED",
    primaryDark: "#5B21B6",
    primaryLight: "#A78BFA",

    // Secondary colors
    secondary: "#C4B5FD",
    secondaryDark: "#8B5CF6",
    secondaryLight: "#DDD6FE",

    // Background colors
    background: "#F5F3FF",
    backgroundSecondary: "#EDE9FE",
    surface: "#ffffff",
    surfaceSecondary: "#F5F3FF",

    // Text colors
    text: "#1E1B4B",
    textSecondary: "#4C4574",
    textTertiary: "#9CA3AF",
    textInverse: "#ffffff",

    // State colors
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",

    // Utility colors
    border: "rgba(124, 58, 237, 0.2)",
    borderLight: "rgba(124, 58, 237, 0.1)",
    shadow: "#000000",
    overlay: "rgba(0,0,0,0.5)",
    divider: "rgba(124, 58, 237, 0.15)",

    // Accent colors
    accent: "#D4AF37",
    accentLight: "#F7E7A1",
    accentDark: "#B8860B",
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    pill: 999,
  },

  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  fontWeight: {
    light: "300",
    regular: "400",
    medium: "500",
    semiBold: "600",
    bold: "700",
    extraBold: "800",
  },

  fontFamily: {
    default: "System",
    regular: "System",
    medium: "System",
    semiBold: "System",
    bold: "System",
    extraBold: "System",
  },

  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      easeIn: "ease-in",
      easeOut: "ease-out",
      easeInOut: "ease-in-out",
    },
  },

  shadows: {
    small: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};
