/**
 * @moruk/hooks - Shared React hooks for identifier apps
 * Types and interfaces used across hooks
 */

/**
 * Image data structure used across all identifier apps
 */
export interface ImageData {
  uri: string;
  id: string;
}

/**
 * Translation function type
 * Compatible with i18next and custom translation implementations
 */
export type TranslateFunction = (key: string, params?: Record<string, string | number>) => string;

/**
 * Configuration for hooks that need app-specific settings
 */
export interface HooksConfig {
  /** Maximum number of images that can be selected */
  maxImages: number;
  /** Translation function for error messages */
  t: TranslateFunction;
}

/**
 * Partial config - allows hooks to work with defaults
 */
export type PartialHooksConfig = Partial<HooksConfig>;
