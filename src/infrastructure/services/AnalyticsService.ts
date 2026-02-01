/**
 * Analytics Service
 *
 * No-op analytics service that maintains API compatibility.
 * All analytics calls are silently ignored (logged in development mode only).
 */

import {
  AnalyticsEvents,
  type AnalyticsEventName,
  type ScreenViewParams,
  type CalculationPerformedParams,
  type InputChangedParams,
  type LineEventParams,
  type DocumentEventParams,
  type DocumentTitleChangedParams,
  type SettingsChangedParams,
  type TabChangedParams,
  type ErrorParams,
  type CalculationErrorParams,
  type AnalyticsUserProperties,
  type CalculationCategory,
} from "@/domain/types/AnalyticsEvents";
import { logger } from "@moruk/logger";

// Check if we're in a development environment
const isDevelopment = __DEV__;

/**
 * Initialize analytics (no-op)
 * Returns false to indicate analytics is not available
 */
export async function initializeAnalytics(): Promise<boolean> {
  if (isDevelopment) {
    logger.info("[Analytics] Analytics disabled (no-op mode)");
  }
  return false;
}

/**
 * Check if analytics is available
 * Always returns false since we're in no-op mode
 */
export function isAnalyticsAvailable(): boolean {
  return false;
}

// Generic params type that allows our typed interfaces
type EventParams = {
  [key: string]: string | number | boolean | undefined;
};

/**
 * Log a generic event (no-op)
 */
async function logEvent(eventName: AnalyticsEventName, params?: EventParams): Promise<void> {
  if (isDevelopment) {
    logger.info(`[Analytics Mock] ${eventName}`, params);
  }
}

// Screen tracking
export async function logScreenView(params: ScreenViewParams): Promise<void> {
  if (isDevelopment) {
    logger.info(`[Analytics Mock] screen_view:`, params);
  }
}

// Calculator events
export async function logCalculationPerformed(params: CalculationPerformedParams): Promise<void> {
  await logEvent(AnalyticsEvents.CALCULATION_PERFORMED, { ...params });
}

export async function logInputChanged(params: InputChangedParams): Promise<void> {
  await logEvent(AnalyticsEvents.INPUT_CHANGED, { ...params });
}

export async function logLineAdded(params: LineEventParams): Promise<void> {
  await logEvent(AnalyticsEvents.LINE_ADDED, { ...params });
}

export async function logLineRemoved(params: LineEventParams): Promise<void> {
  await logEvent(AnalyticsEvents.LINE_REMOVED, { ...params });
}

// Document events
export async function logDocumentSaved(params: DocumentEventParams): Promise<void> {
  await logEvent(AnalyticsEvents.DOCUMENT_SAVED, { ...params });
}

export async function logDocumentLoaded(params: DocumentEventParams): Promise<void> {
  await logEvent(AnalyticsEvents.DOCUMENT_LOADED, { ...params });
}

export async function logDocumentDeleted(params: DocumentEventParams): Promise<void> {
  await logEvent(AnalyticsEvents.DOCUMENT_DELETED, { ...params });
}

export async function logDocumentCleared(): Promise<void> {
  await logEvent(AnalyticsEvents.DOCUMENT_CLEARED);
}

export async function logDocumentTitleChanged(params: DocumentTitleChangedParams): Promise<void> {
  await logEvent(AnalyticsEvents.DOCUMENT_TITLE_CHANGED, { ...params });
}

// Settings events
export async function logSettingsChanged(params: SettingsChangedParams): Promise<void> {
  await logEvent(AnalyticsEvents.SETTINGS_CHANGED, { ...params });
}

export async function logEmBaseChanged(oldValue: number, newValue: number): Promise<void> {
  await logEvent(AnalyticsEvents.EM_BASE_CHANGED, {
    old_value: oldValue,
    new_value: newValue,
  });
}

export async function logPpiBaseChanged(oldValue: number, newValue: number): Promise<void> {
  await logEvent(AnalyticsEvents.PPI_BASE_CHANGED, {
    old_value: oldValue,
    new_value: newValue,
  });
}

// Navigation events
export async function logTabChanged(params: TabChangedParams): Promise<void> {
  await logEvent(AnalyticsEvents.TAB_CHANGED, { ...params });
}

// Error events
export async function logError(params: ErrorParams): Promise<void> {
  await logEvent(AnalyticsEvents.ERROR_OCCURRED, { ...params });
}

export async function logCalculationError(params: CalculationErrorParams): Promise<void> {
  await logEvent(AnalyticsEvents.CALCULATION_ERROR, { ...params });
}

// App lifecycle events
export async function logAppOpened(): Promise<void> {
  await logEvent(AnalyticsEvents.APP_OPENED, {
    timestamp: Date.now(),
  });
}

export async function logAppBackgrounded(): Promise<void> {
  await logEvent(AnalyticsEvents.APP_BACKGROUNDED, {
    timestamp: Date.now(),
  });
}

// User properties
export async function setUserProperties(properties: AnalyticsUserProperties): Promise<void> {
  if (isDevelopment) {
    logger.info("[Analytics Mock] setUserProperties:", properties);
  }
}

// Analytics collection control (for GDPR compliance)
export async function setAnalyticsCollectionEnabled(enabled: boolean): Promise<void> {
  if (isDevelopment) {
    logger.info(`[Analytics Mock] Collection ${enabled ? "enabled" : "disabled"}`);
  }
}

// Reset analytics data
export async function resetAnalyticsData(): Promise<void> {
  if (isDevelopment) {
    logger.info("[Analytics Mock] Data reset");
  }
}

// Utility functions for building event params
export function buildCalculationParams(
  input: string,
  category: CalculationCategory,
  success: boolean
): CalculationPerformedParams {
  return {
    expression_type: category,
    success,
    has_currency: /[$€£¥]/.test(input),
    has_unit: /(km|mi|kg|lb|ml|oz|px|em|rem|pt)/i.test(input),
    has_percentage: /%/.test(input),
    input_length: input.length,
  };
}

export function buildDocumentParams(
  id: string,
  title: string,
  lineCount: number,
  hasVariables: boolean
): DocumentEventParams {
  return {
    document_id: id,
    title_length: title.length,
    line_count: lineCount,
    has_variables: hasVariables,
  };
}

// Export all event methods as a unified service object
export const analyticsService = {
  initialize: initializeAnalytics,
  isAvailable: isAnalyticsAvailable,

  // Screen
  logScreenView,

  // Calculator
  logCalculationPerformed,
  logInputChanged,
  logLineAdded,
  logLineRemoved,

  // Document
  logDocumentSaved,
  logDocumentLoaded,
  logDocumentDeleted,
  logDocumentCleared,
  logDocumentTitleChanged,

  // Settings
  logSettingsChanged,
  logEmBaseChanged,
  logPpiBaseChanged,

  // Navigation
  logTabChanged,

  // Errors
  logError,
  logCalculationError,

  // Lifecycle
  logAppOpened,
  logAppBackgrounded,

  // User
  setUserProperties,
  setAnalyticsCollectionEnabled,
  resetAnalyticsData,

  // Utilities
  buildCalculationParams,
  buildDocumentParams,
};

export default analyticsService;
