/**
 * Sentry Error Handler
 * Integrates AppError system with Sentry error tracking
 */

import * as Sentry from "@sentry/react-native";
import type { AppError, ErrorHandler } from "./errorHandling";

export class SentryErrorHandler implements ErrorHandler {
  handleError(error: AppError): void {
    // Set Sentry context from AppError metadata
    Sentry.setContext("appError", {
      code: error.code,
      severity: error.severity,
      category: error.category,
      userMessage: error.userMessage,
    });

    // Only set errorContext if there's more than just timestamp
    const contextKeys = Object.keys(error.context);
    const hasNonTimestampContext = contextKeys.some((key) => key !== "timestamp");
    if (error.context && hasNonTimestampContext) {
      Sentry.setContext("errorContext", error.context);
    }

    // Set tags for filtering in Sentry
    Sentry.setTag("error.severity", error.severity);
    Sentry.setTag("error.category", error.category);
    Sentry.setTag("error.code", error.code);

    // Capture the error with full stack trace
    Sentry.captureException(error.originalError || error, {
      level: this.mapSeverityToSentryLevel(error.severity),
    });
  }

  private mapSeverityToSentryLevel(severity: string): Sentry.SeverityLevel {
    switch (severity) {
      case "low":
        return "info";
      case "medium":
        return "warning";
      case "high":
        return "error";
      case "critical":
        return "fatal";
      default:
        return "error";
    }
  }
}
