/**
 * App Configuration Types
 *
 * Defines the structure for app-specific configuration.
 * Apps can extend these types with additional properties.
 */

/**
 * Related app link for cross-promotion
 */
export interface RelatedApp {
  id: string;
  name: string;
  url: string;
  icon: string;
}

/**
 * Custom settings section
 */
export interface CustomSection {
  id: string;
  title: string;
  icon: string;
  type: "link" | "action" | "toggle" | "custom";
  url?: string;
  action?: string;
}

/**
 * UI customization options
 */
export interface UIConfig {
  /** Show header on main screens */
  showHeader: boolean;
  /** Show privacy note on home screen */
  showPrivacyNote: boolean;
  /** Header style variant */
  headerStyle: "default" | "minimal" | "branded";
  /** Primary button style */
  buttonStyle: "gradient" | "solid" | "outline" | "primary";
  /** Maximum number of images for analysis */
  maxImages: number;
}

/**
 * Settings screen configuration
 */
export interface SettingsConfig {
  /** Enable language selection in settings */
  enableLanguageSelection: boolean;
  /** Show app version in settings */
  showVersion: boolean;
  /** Show rate app button */
  showRateApp: boolean;
  /** Show share app button */
  showShare: boolean;

  // URLs
  supportUrl?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  appStoreUrl?: string;
  playStoreUrl?: string;

  /** Message used when sharing the app */
  shareMessage?: string;

  // Related apps section
  showRelatedApps?: boolean;
  relatedApps?: RelatedApp[];

  // Custom sections
  customSections?: CustomSection[];
}

/**
 * Base app configuration
 */
export interface BaseAppConfig {
  // App Identity
  /** Internal app name (e.g., "babyglimpse") */
  appName: string;
  /** Display name shown to users (e.g., "Numy") */
  appDisplayName: string;
  /** App description for App Store/Play Store */
  appDescription: string;
  /** URL-safe slug (e.g., "babyglimpse") */
  appSlug: string;
  /** Bundle identifier (e.g., "ai.moruk.babyglimpse") */
  bundleIdentifier: string;

  // Branding colors
  /** Primary brand color */
  primaryColor: string;
  /** Secondary brand color */
  secondaryColor: string;
  /** Background color */
  backgroundColor: string;

  // UI configuration
  ui: UIConfig;

  // Settings configuration
  settings: SettingsConfig;
}

/**
 * Extensible app configuration type
 *
 * @example
 * ```ts
 * // Basic usage
 * const config: AppConfig = createAppConfig({ ... });
 *
 * // With extended properties
 * interface CatDoctorExtensions {
 *   doctorFamilyApps: RelatedApp[];
 * }
 * const config: AppConfig<CatDoctorExtensions> = createAppConfig({ ... });
 * ```
 */
export type AppConfig<TExtended extends Record<string, unknown> = Record<string, unknown>> =
  BaseAppConfig & TExtended;

/**
 * Options for creating an app configuration
 */
export interface CreateAppConfigOptions {
  // Required identity fields
  appName: string;
  appDisplayName: string;
  appDescription: string;
  bundleIdentifier: string;

  // Optional identity fields
  appSlug?: string;

  // Branding
  primaryColor: string;
  secondaryColor?: string;
  backgroundColor?: string;

  // UI options (all optional with defaults)
  ui?: Partial<UIConfig>;

  // Settings options (all optional with defaults)
  settings?: Partial<SettingsConfig>;
}

/**
 * Default UI configuration
 */
export const defaultUIConfig: UIConfig = {
  showHeader: true,
  showPrivacyNote: true,
  headerStyle: "default",
  buttonStyle: "solid",
  maxImages: 5,
};

/**
 * Default settings configuration
 */
export const defaultSettingsConfig: SettingsConfig = {
  enableLanguageSelection: true,
  showVersion: true,
  showRateApp: false,
  showShare: true,
  showRelatedApps: false,
  relatedApps: [],
  customSections: [],
};
