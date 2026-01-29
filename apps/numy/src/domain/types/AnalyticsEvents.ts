/**
 * Analytics Events Type Definitions
 *
 * Type-safe event schemas for Firebase Analytics.
 * Following Firebase recommended naming conventions (snake_case).
 */

// Event names as const for type safety
export const AnalyticsEvents = {
  // Screen events
  SCREEN_VIEW: "screen_view",

  // Calculator events
  CALCULATION_PERFORMED: "calculation_performed",
  INPUT_CHANGED: "input_changed",
  LINE_ADDED: "line_added",
  LINE_REMOVED: "line_removed",

  // Document events
  DOCUMENT_SAVED: "document_saved",
  DOCUMENT_LOADED: "document_loaded",
  DOCUMENT_DELETED: "document_deleted",
  DOCUMENT_CLEARED: "document_cleared",
  DOCUMENT_TITLE_CHANGED: "document_title_changed",

  // Settings events
  SETTINGS_CHANGED: "settings_changed",
  EM_BASE_CHANGED: "em_base_changed",
  PPI_BASE_CHANGED: "ppi_base_changed",

  // Navigation events
  TAB_CHANGED: "tab_changed",

  // Error events
  ERROR_OCCURRED: "error_occurred",
  CALCULATION_ERROR: "calculation_error",

  // App lifecycle events
  APP_OPENED: "app_opened",
  APP_BACKGROUNDED: "app_backgrounded",
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

// Screen names
export const ScreenNames = {
  CALCULATOR: "Calculator",
  HISTORY: "History",
  SETTINGS: "Settings",
} as const;

export type ScreenName = (typeof ScreenNames)[keyof typeof ScreenNames];

// Calculation categories (from CalculationEngine)
export type CalculationCategory =
  | "myCalculations"
  | "unitConversion"
  | "functions"
  | "variables"
  | "cssCalculations"
  | "comment";

// Event parameter types
export interface ScreenViewParams {
  screen_name: ScreenName;
  screen_class?: string;
}

export interface CalculationPerformedParams {
  expression_type: CalculationCategory;
  success: boolean;
  has_currency: boolean;
  has_unit: boolean;
  has_percentage: boolean;
  input_length: number;
}

export interface InputChangedParams {
  screen_name: ScreenName;
  input_length: number;
  has_content: boolean;
}

export interface LineEventParams {
  screen_name: ScreenName;
  line_count: number;
}

export interface DocumentEventParams {
  document_id: string;
  title_length: number;
  line_count: number;
  has_variables: boolean;
}

export interface DocumentTitleChangedParams {
  old_title_length: number;
  new_title_length: number;
}

export interface SettingsChangedParams {
  setting_name: "em_base" | "ppi_base";
  old_value: number;
  new_value: number;
}

export interface TabChangedParams {
  from_tab?: ScreenName;
  to_tab: ScreenName;
}

export interface ErrorParams {
  error_type: string;
  error_message: string;
  screen_name?: ScreenName;
  input?: string;
}

export interface CalculationErrorParams {
  error_message: string;
  input: string;
  screen_name: ScreenName;
}

export interface AppLifecycleParams {
  timestamp: number;
}

// Union type for all event parameters
export type AnalyticsEventParams =
  | ScreenViewParams
  | CalculationPerformedParams
  | InputChangedParams
  | LineEventParams
  | DocumentEventParams
  | DocumentTitleChangedParams
  | SettingsChangedParams
  | TabChangedParams
  | ErrorParams
  | CalculationErrorParams
  | AppLifecycleParams
  | Record<string, unknown>;

// User properties
export interface AnalyticsUserProperties {
  locale?: string;
  em_base?: string;
  ppi_base?: string;
  saved_documents_count?: string;
  app_version?: string;
}
