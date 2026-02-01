/**
 * Centralized Error Handling System
 * Provides consistent error handling across the application
 */

import { logger } from "@moruk/logger";
import { AppError, ErrorCategory, ErrorHandler, ErrorSeverity, type ErrorContext } from "./types";

// Re-export types for consumers
export {
  AppError,
  ErrorCategory,
  ErrorSeverity,
  type ErrorContext,
  type ErrorHandler,
} from "./types";

export class ConsoleErrorHandler implements ErrorHandler {
  handleError(error: AppError): void {
    const errorDetails = {
      message: error.message,
      code: error.code,
      severity: error.severity,
      category: error.category,
      context: error.context,
      stack: error.stack,
    };

    // Use appropriate logger method based on severity
    switch (error.severity) {
      case ErrorSeverity.LOW:
        logger.info("AppError:", errorDetails);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn("AppError:", errorDetails);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        logger.error("AppError:", errorDetails);
        break;
      default:
        logger.warn("AppError:", errorDetails);
    }
  }
}

export class ErrorHandlerChain implements ErrorHandler {
  private handlers: ErrorHandler[] = [];

  addHandler(handler: ErrorHandler): void {
    this.handlers.push(handler);
  }

  handleError(error: AppError): void {
    this.handlers.forEach((handler) => {
      try {
        handler.handleError(error);
      } catch (handlerError) {
        logger.error("Error in error handler:", handlerError);
      }
    });
  }
}

// Global error handler instance
export const globalErrorHandler = new ErrorHandlerChain();
globalErrorHandler.addHandler(new ConsoleErrorHandler());

// Add Sentry error handler
import { SentryErrorHandler } from "./SentryErrorHandler";
globalErrorHandler.addHandler(new SentryErrorHandler());
