/**
 * Centralized Error Handling System
 * Provides consistent error handling across the application
 */

import { logger } from "@moruk/logger";

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ErrorCategory {
  NETWORK = "network",
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  PERMISSION = "permission",
  STORAGE = "storage",
  API = "api",
  UI = "ui",
  UNKNOWN = "unknown",
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly userMessage: string;
  public readonly context: ErrorContext;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    userMessage?: string,
    context: ErrorContext = {},
    originalError?: Error
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.severity = severity;
    this.category = category;
    this.userMessage = userMessage || this.getDefaultUserMessage();
    this.context = {
      ...context,
      timestamp: context.timestamp || new Date(),
    };
    this.originalError = originalError;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  private getDefaultUserMessage(): string {
    switch (this.category) {
      case ErrorCategory.NETWORK:
        return "Network connection issue. Please check your internet connection and try again.";
      case ErrorCategory.API:
        return "Service temporarily unavailable. Please try again in a moment.";
      case ErrorCategory.VALIDATION:
        return "Please check your input and try again.";
      case ErrorCategory.AUTHENTICATION:
        return "Authentication failed. Please log in again.";
      case ErrorCategory.PERMISSION:
        return "Permission denied. Please check your permissions.";
      case ErrorCategory.STORAGE:
        return "Storage operation failed. Please try again.";
      default:
        return "Something went wrong. Please try again.";
    }
  }
}

export interface ErrorHandler {
  handleError(error: AppError): void;
}

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
