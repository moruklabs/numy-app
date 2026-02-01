/**
 * Shared Constants
 *
 * App-wide constants used across the moruk app ecosystem.
 */

/**
 * Image configuration for analysis features
 */
export const IMAGE_CONFIG = {
  /** Maximum number of images that can be selected */
  MAX_IMAGES: 5,
  /** Maximum file size in bytes (5MB) */
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  /** Maximum image dimension in pixels */
  MAX_DIMENSION: 2048,
  /** JPEG compression quality (0-1) */
  COMPRESSION_QUALITY: 0.8,
  /** Supported image formats */
  SUPPORTED_FORMATS: ["jpg", "jpeg", "png", "webp"] as const,
  /** Preview thumbnail size in pixels */
  PREVIEW_SIZE: 64,
} as const;

/**
 * Layout constants for consistent spacing
 */
export const LAYOUT = {
  /** Standard header height */
  HEADER_HEIGHT: 56,
  /** Tab bar height */
  TAB_BAR_HEIGHT: 60,
  /** Content horizontal padding */
  CONTENT_PADDING: 16,
  /** Maximum content width for different screen sizes */
  CONTENT_MAX_WIDTH: {
    PHONE: "90%" as const,
    TABLET_PORTRAIT: 500,
    TABLET_LANDSCAPE: 600,
  },
  /** Safe area padding */
  SAFE_AREA_PADDING: 20,
} as const;

/**
 * Animation timing constants
 */
export const ANIMATION = {
  /** Fast animation duration (ms) */
  FAST: 150,
  /** Normal animation duration (ms) */
  NORMAL: 300,
  /** Slow animation duration (ms) */
  SLOW: 500,
  /** Spring animation config */
  SPRING: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  },
} as const;

/**
 * API configuration
 */
export const API = {
  /** Gemini API proxy URL */
  GEMINI_PROXY_URL: "https://gemini-api.moruk.workers.dev",
  /** Monitor API URL */
  MONITOR_API_URL: "https://monitor-api.moruk.workers.dev",
  /** Default request timeout (ms) */
  DEFAULT_TIMEOUT: 30000,
  /** Maximum retry attempts */
  MAX_RETRIES: 3,
} as const;

/**
 * Storage keys for AsyncStorage
 */
export const STORAGE_KEYS = {
  /** User language preference */
  LANGUAGE: "@moruk/language",
  /** Theme preference */
  THEME: "@moruk/theme",
  /** Onboarding completed flag */
  ONBOARDING_COMPLETED: "@moruk/onboarding_completed",
  /** Last insight shown date */
  LAST_INSIGHT_DATE: "@moruk/last_insight_date",
  /** User preferences */
  USER_PREFERENCES: "@moruk/user_preferences",
} as const;

/**
 * Accessibility constants
 */
export const ACCESSIBILITY = {
  /** Minimum touch target size (iOS HIG) */
  MIN_TOUCH_TARGET: 44,
  /** Standard button height */
  BUTTON_HEIGHT: 48,
  /** Large button height */
  BUTTON_HEIGHT_LARGE: 56,
} as const;

/**
 * Z-index scale for layering
 */
export const Z_INDEX = {
  /** Base content */
  BASE: 0,
  /** Elevated content */
  ELEVATED: 10,
  /** Sticky headers */
  STICKY: 100,
  /** Overlays and backdrops */
  OVERLAY: 1000,
  /** Modals */
  MODAL: 2000,
  /** Tooltips and popovers */
  TOOLTIP: 3000,
  /** Toasts and notifications */
  TOAST: 4000,
} as const;
