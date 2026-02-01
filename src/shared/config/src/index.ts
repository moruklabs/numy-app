/**
 * @moruk/config
 *
 * Shared configuration package for the moruk app ecosystem.
 *
 * Features:
 * - Extensible theme system with factory functions
 * - Pre-defined color palettes for all apps
 * - App configuration types and factories
 * - Shared constants for consistent behavior
 *
 * @example
 * ```ts
 * import {
 *   createTheme,
 *   orangePalette,
 *   createAppConfig,
 *   IMAGE_CONFIG,
 * } from "@moruk/config";
 *
 * // Create a theme
 * const darkTheme = createTheme({
 *   mode: "dark",
 *   colors: orangePalette,
 * });
 *
 * // Create app config
 * const appConfig = createAppConfig({
 *   appName: "catdoctor",
 *   appDisplayName: "Pet Doctor",
 *   appDescription: "AI cat health analyzer",
 *   bundleIdentifier: "ai.moruk.catdoctor",
 *   primaryColor: orangePalette.primary,
 * });
 *
 * // Use constants
 * const maxImages = IMAGE_CONFIG.MAX_IMAGES;
 * ```
 */

// Theme exports
export {
  colorPresets,
  compactSpacing,
  // Factory
  createTheme,
  createThemePair,
  cyanPalette,
  darkModeShadows,
  deepPurplePalette,
  defaultAnimations,
  defaultBorderRadius,
  defaultFontSizes,
  defaultLineHeights,
  // Defaults
  defaultSpacing,
  fontWeights,
  greenPalette,
  indigoPalette,
  interFontFamily,
  lightModeShadows,
  montserratFontFamily,
  natureGreenPalette,
  navyPalette,
  orangePalette,
  pinkPalette,
  purplePalette,
  // Presets
  silverPalette,
  skyBluePalette,
  stateColors,
  systemFontFamily,
  type BaseTheme,
  // Types
  type BaseThemeColors,
  type ColorPalette,
  type ColorPresetName,
  type CreateThemeOptions,
  type Theme,
  type ThemeAnimations,
  type ThemeBorderRadius,
  type ThemeColors,
  type ThemeFontFamilies,
  type ThemeFontSizes,
  type ThemeFontWeights,
  type ThemeLineHeights,
  type ThemeMode,
  type ThemeShadow,
  type ThemeShadows,
  type ThemeSpacing,
} from "./theme";

// App config exports
export {
  // Factory
  createAppConfig,
  createShareMessage,
  defaultSettingsConfig,
  // Defaults
  defaultUIConfig,
  generateAppUrls,
  type AppConfig,
  type BaseAppConfig,
  type CreateAppConfigOptions,
  type CustomSection,
  // Types
  type RelatedApp,
  type SettingsConfig,
  type UIConfig,
} from "./app-config";

// Constants exports
export {
  ACCESSIBILITY,
  ANIMATION,
  API,
  IMAGE_CONFIG,
  LAYOUT,
  STORAGE_KEYS,
  Z_INDEX,
} from "./constants";
