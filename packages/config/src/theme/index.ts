/**
 * Theme Module
 *
 * Exports all theme-related types, defaults, presets, and factory functions.
 */

// Types
export type {
  BaseThemeColors,
  ThemeColors,
  ThemeSpacing,
  ThemeBorderRadius,
  ThemeFontSizes,
  ThemeLineHeights,
  ThemeFontWeights,
  ThemeFontFamilies,
  ThemeAnimations,
  ThemeShadow,
  ThemeShadows,
  BaseTheme,
  Theme,
  ThemeMode,
  ColorPalette,
  CreateThemeOptions,
} from "./types";

// Defaults
export {
  defaultSpacing,
  compactSpacing,
  defaultBorderRadius,
  defaultFontSizes,
  defaultLineHeights,
  fontWeights,
  systemFontFamily,
  montserratFontFamily,
  interFontFamily,
  defaultAnimations,
  darkModeShadows,
  lightModeShadows,
  stateColors,
} from "./defaults";

// Presets
export {
  silverPalette,
  orangePalette,
  greenPalette,
  indigoPalette,
  cyanPalette,
  pinkPalette,
  purplePalette,
  navyPalette,
  natureGreenPalette,
  skyBluePalette,
  deepPurplePalette,
  colorPresets,
} from "./presets";
export type { ColorPresetName } from "./presets";

// Factory
export { createTheme, createThemePair } from "./factory";
