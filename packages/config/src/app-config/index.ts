/**
 * App Configuration Module
 *
 * Exports all app configuration types and factory functions.
 */

// Types
export type {
  RelatedApp,
  CustomSection,
  UIConfig,
  SettingsConfig,
  BaseAppConfig,
  AppConfig,
  CreateAppConfigOptions,
} from "./types";

// Defaults
export { defaultUIConfig, defaultSettingsConfig } from "./types";

// Factory
export { createAppConfig, generateAppUrls, createShareMessage } from "./factory";
