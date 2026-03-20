/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

// --- Error types ---
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ErrorCategory {
  NETWORK = "network",
  VALIDATION = "validation",
  UNKNOWN = "unknown",
}

export class AppError extends Error {
  code: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  userMessage: string;
  context?: Record<string, any>;
  originalError?: Error;

  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity,
    category: ErrorCategory,
    userMessage: string,
    context?: Record<string, any>,
    originalError?: Error
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.severity = severity;
    this.category = category;
    this.userMessage = userMessage;
    this.context = context;
    this.originalError = originalError;
  }
}

// --- Global error handler ---
export const globalErrorHandler = {
  handleError: (_error: AppError) => {},
};

// --- ErrorBoundary ---
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}
