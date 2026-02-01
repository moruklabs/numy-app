/**
 * Error Handling Types
 * Type definitions for the error handling system.
 * This file is used to break circular dependencies between errorHandling.ts and SentryErrorHandler.ts.
 */

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
  isFatal?: boolean;
  metadata?: Record<string, any>;
  [key: string]: unknown;
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
