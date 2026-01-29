/**
 * Default Theme Values
 *
 * Shared default values for spacing, typography, and other tokens.
 * These are used as base values that can be overridden per-app.
 */

import type {
  ThemeSpacing,
  ThemeBorderRadius,
  ThemeFontSizes,
  ThemeLineHeights,
  ThemeFontWeights,
  ThemeFontFamilies,
  ThemeAnimations,
  ThemeShadows,
} from "./types";

/**
 * Default spacing scale (4px base unit)
 */
export const defaultSpacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
};

/**
 * Compact spacing scale (for dense UIs)
 */
export const compactSpacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
};

/**
 * Default border radius scale
 */
export const defaultBorderRadius: ThemeBorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
};

/**
 * Default font sizes
 */
export const defaultFontSizes: ThemeFontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
};

/**
 * Default line heights
 */
export const defaultLineHeights: ThemeLineHeights = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  xxl: 32,
  xxxl: 40,
};

/**
 * Font weight tokens (constant across all themes)
 */
export const fontWeights: ThemeFontWeights = {
  light: "300",
  regular: "400",
  medium: "500",
  semiBold: "600",
  bold: "700",
  extraBold: "800",
};

/**
 * System font family (uses platform default)
 */
export const systemFontFamily: ThemeFontFamilies = {
  default: "",
  regular: "",
  medium: "",
  semiBold: "",
  bold: "",
  extraBold: "",
};

/**
 * Montserrat font family
 */
export const montserratFontFamily: ThemeFontFamilies = {
  default: "Montserrat-Regular",
  regular: "Montserrat-Regular",
  medium: "Montserrat-Medium",
  semiBold: "Montserrat-SemiBold",
  bold: "Montserrat-Bold",
  extraBold: "Montserrat-ExtraBold",
};

/**
 * Inter font family
 */
export const interFontFamily: ThemeFontFamilies = {
  default: "Inter-Regular",
  regular: "Inter-Regular",
  medium: "Inter-Medium",
  semiBold: "Inter-SemiBold",
  bold: "Inter-Bold",
  extraBold: "Inter-ExtraBold",
};

/**
 * Default animation tokens
 */
export const defaultAnimations: ThemeAnimations = {
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
};

/**
 * Default shadows for dark mode
 */
export const darkModeShadows: ThemeShadows = {
  small: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
};

/**
 * Default shadows for light mode
 */
export const lightModeShadows: ThemeShadows = {
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
};

/**
 * State colors (consistent across all apps)
 */
export const stateColors = {
  success: "#22C55E",
  warning: "#EAB308",
  error: "#EF4444",
  info: "#3B82F6",
} as const;
