/**
 * Theme Factory
 *
 * Factory functions for creating consistent themes across apps.
 * Supports both light and dark modes with customizable color palettes.
 */

import type {
  Theme,
  ColorPalette,
  CreateThemeOptions,
  BaseThemeColors,
  ThemeFontFamilies,
} from "./types";
import {
  defaultSpacing,
  defaultBorderRadius,
  defaultFontSizes,
  defaultLineHeights,
  fontWeights,
  systemFontFamily,
  defaultAnimations,
  darkModeShadows,
  lightModeShadows,
  stateColors,
} from "./defaults";

/**
 * Generate dark mode colors from a color palette
 */
function generateDarkModeColors(palette: ColorPalette): BaseThemeColors {
  return {
    // Primary colors
    primary: palette.primary,
    primaryDark: palette.primaryDark ?? darken(palette.primary, 0.2),
    primaryLight: palette.primaryLight ?? lighten(palette.primary, 0.2),

    // Secondary colors
    secondary: palette.secondary ?? lighten(palette.primary, 0.3),
    secondaryDark: darken(palette.secondary ?? palette.primary, 0.1),
    secondaryLight: lighten(palette.secondary ?? palette.primary, 0.2),

    // Background colors - Dark mode
    background: "#0F0F0F",
    backgroundSecondary: "#1A1A1A",
    surface: "#242424",
    surfaceSecondary: "#2E2E2E",

    // Text colors - Light text for dark mode
    text: "#FFFFFF",
    textSecondary: "#CCCCCC",
    textTertiary: "#888888",
    textInverse: "#0F0F0F",

    // State colors
    success: palette.success ?? stateColors.success,
    warning: palette.warning ?? stateColors.warning,
    error: palette.error ?? stateColors.error,
    info: palette.info ?? stateColors.info,

    // Utility colors
    border: `rgba(${hexToRgb(palette.primary)}, 0.2)`,
    borderLight: `rgba(${hexToRgb(palette.primary)}, 0.1)`,
    shadow: "#000000",
    overlay: "rgba(0, 0, 0, 0.7)",
    divider: `rgba(${hexToRgb(palette.primary)}, 0.15)`,

    // Accent colors
    accent: palette.accent ?? palette.primary,
    accentLight: lighten(palette.accent ?? palette.primary, 0.2),
    accentDark: darken(palette.accent ?? palette.primary, 0.2),
  };
}

/**
 * Generate light mode colors from a color palette
 */
function generateLightModeColors(palette: ColorPalette): BaseThemeColors {
  return {
    // Primary colors (darker for contrast on light backgrounds)
    primary: darken(palette.primary, 0.1),
    primaryDark: palette.primaryDark ?? darken(palette.primary, 0.3),
    primaryLight: palette.primaryLight ?? lighten(palette.primary, 0.3),

    // Secondary colors
    secondary: palette.secondary ?? lighten(palette.primary, 0.2),
    secondaryDark: darken(palette.secondary ?? palette.primary, 0.15),
    secondaryLight: lighten(palette.secondary ?? palette.primary, 0.3),

    // Background colors - Light mode
    background: "#FAFAFA",
    backgroundSecondary: "#F4F4F5",
    surface: "#FFFFFF",
    surfaceSecondary: "#E4E4E7",

    // Text colors - Dark text for light mode
    text: "#18181B",
    textSecondary: "#52525B",
    textTertiary: "#A1A1AA",
    textInverse: "#FAFAFA",

    // State colors
    success: palette.success ?? stateColors.success,
    warning: palette.warning ?? stateColors.warning,
    error: palette.error ?? stateColors.error,
    info: palette.info ?? stateColors.info,

    // Utility colors
    border: `rgba(${hexToRgb(palette.primary)}, 0.2)`,
    borderLight: `rgba(${hexToRgb(palette.primary)}, 0.1)`,
    shadow: "#000000",
    overlay: "rgba(0, 0, 0, 0.5)",
    divider: `rgba(${hexToRgb(palette.primary)}, 0.15)`,

    // Accent colors
    accent: palette.accent ?? palette.primary,
    accentLight: lighten(palette.accent ?? palette.primary, 0.3),
    accentDark: darken(palette.accent ?? palette.primary, 0.2),
  };
}

/**
 * Create a theme from options
 *
 * @example
 * ```ts
 * import { createTheme, orangePalette } from "@moruk/config";
 *
 * const darkTheme = createTheme({
 *   mode: "dark",
 *   colors: orangePalette,
 * });
 *
 * const lightTheme = createTheme({
 *   mode: "light",
 *   colors: orangePalette,
 *   fontFamily: montserratFontFamily,
 * });
 * ```
 */
export function createTheme<
  TExtendedColors extends Record<string, string> = Record<string, string>,
>(options: CreateThemeOptions<TExtendedColors>): Theme<TExtendedColors> {
  const {
    mode,
    colors: palette,
    extendedColors,
    fontFamily,
    spacing,
    borderRadius,
    fontSize,
  } = options;

  const baseColors =
    mode === "dark" ? generateDarkModeColors(palette) : generateLightModeColors(palette);

  const mergedColors = extendedColors ? { ...baseColors, ...extendedColors } : baseColors;

  const mergedFontFamily: ThemeFontFamilies = fontFamily
    ? { ...systemFontFamily, ...fontFamily }
    : systemFontFamily;

  return {
    colors: mergedColors as Theme<TExtendedColors>["colors"],
    spacing: spacing ? { ...defaultSpacing, ...spacing } : defaultSpacing,
    borderRadius: borderRadius ? { ...defaultBorderRadius, ...borderRadius } : defaultBorderRadius,
    fontSize: fontSize ? { ...defaultFontSizes, ...fontSize } : defaultFontSizes,
    lineHeight: defaultLineHeights,
    fontWeight: fontWeights,
    fontFamily: mergedFontFamily,
    animations: defaultAnimations,
    shadows: mode === "dark" ? darkModeShadows : lightModeShadows,
  };
}

/**
 * Create both light and dark themes from a color palette
 *
 * @example
 * ```ts
 * import { createThemePair, silverPalette } from "@moruk/config";
 *
 * const { lightTheme, darkTheme } = createThemePair(silverPalette);
 * ```
 */
export function createThemePair<
  TExtendedColors extends Record<string, string> = Record<string, string>,
>(
  palette: ColorPalette,
  options?: Omit<CreateThemeOptions<TExtendedColors>, "mode" | "colors">
): { lightTheme: Theme<TExtendedColors>; darkTheme: Theme<TExtendedColors> } {
  return {
    lightTheme: createTheme({ ...options, mode: "light", colors: palette }),
    darkTheme: createTheme({ ...options, mode: "dark", colors: palette }),
  };
}

// ============================================================================
// Color Utility Functions
// ============================================================================

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): string {
  // Handle rgba/rgb format
  if (hex.startsWith("rgba") || hex.startsWith("rgb")) {
    const match = hex.match(/\d+/g);
    if (match && match.length >= 3) {
      return `${match[0]}, ${match[1]}, ${match[2]}`;
    }
    return "255, 255, 255";
  }

  // Handle hex format
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return "255, 255, 255";
}

/**
 * Darken a hex color by a percentage
 */
function darken(hex: string, amount: number): string {
  // Handle rgba/rgb format - return as is
  if (hex.startsWith("rgba") || hex.startsWith("rgb")) {
    return hex;
  }

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  const r = Math.max(0, Math.floor(parseInt(result[1], 16) * (1 - amount)));
  const g = Math.max(0, Math.floor(parseInt(result[2], 16) * (1 - amount)));
  const b = Math.max(0, Math.floor(parseInt(result[3], 16) * (1 - amount)));

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Lighten a hex color by a percentage
 */
function lighten(hex: string, amount: number): string {
  // Handle rgba/rgb format - return as is
  if (hex.startsWith("rgba") || hex.startsWith("rgb")) {
    return hex;
  }

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  const r = Math.min(
    255,
    Math.floor(parseInt(result[1], 16) + (255 - parseInt(result[1], 16)) * amount)
  );
  const g = Math.min(
    255,
    Math.floor(parseInt(result[2], 16) + (255 - parseInt(result[2], 16)) * amount)
  );
  const b = Math.min(
    255,
    Math.floor(parseInt(result[3], 16) + (255 - parseInt(result[3], 16)) * amount)
  );

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
