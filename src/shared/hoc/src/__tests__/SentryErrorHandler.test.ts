/**
 * Tests for SentryErrorHandler
 */

import * as Sentry from "@sentry/react-native";
import { SentryErrorHandler } from "../SentryErrorHandler";
import { AppError, ErrorSeverity, ErrorCategory } from "../errorHandling";

// Mock Sentry
jest.mock("@sentry/react-native", () => ({
  setContext: jest.fn(),
  setTag: jest.fn(),
  captureException: jest.fn(),
}));

describe("SentryErrorHandler", () => {
  let handler: SentryErrorHandler;

  beforeEach(() => {
    handler = new SentryErrorHandler();
    jest.clearAllMocks();
  });

  describe("handleError", () => {
    it("should capture exception with Sentry", () => {
      const error = new AppError(
        "Test error",
        "TEST_ERROR",
        ErrorSeverity.MEDIUM,
        ErrorCategory.API,
        "User friendly message"
      );

      handler.handleError(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        level: "warning",
      });
    });

    it("should set appError context with error metadata", () => {
      const error = new AppError(
        "Test error",
        "TEST_ERROR",
        ErrorSeverity.HIGH,
        ErrorCategory.NETWORK,
        "Network issue"
      );

      handler.handleError(error);

      expect(Sentry.setContext).toHaveBeenCalledWith("appError", {
        code: "TEST_ERROR",
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.NETWORK,
        userMessage: "Network issue",
      });
    });

    it("should set errorContext when context exists", () => {
      const context = {
        component: "TestComponent",
        action: "testAction",
        userId: "user123",
      };

      const error = new AppError(
        "Test error",
        "TEST_ERROR",
        ErrorSeverity.MEDIUM,
        ErrorCategory.UI,
        "UI error",
        context
      );

      handler.handleError(error);

      expect(Sentry.setContext).toHaveBeenCalledWith(
        "errorContext",
        expect.objectContaining({
          component: "TestComponent",
          action: "testAction",
          userId: "user123",
        })
      );
    });

    it("should not set errorContext when context is empty", () => {
      const error = new AppError(
        "Test error",
        "TEST_ERROR",
        ErrorSeverity.MEDIUM,
        ErrorCategory.UI
      );

      handler.handleError(error);

      // Should be called only once with appError context
      expect(Sentry.setContext).toHaveBeenCalledTimes(1);
      expect(Sentry.setContext).toHaveBeenCalledWith("appError", expect.any(Object));
    });

    it("should set Sentry tags for filtering", () => {
      const error = new AppError(
        "Test error",
        "TEST_ERROR",
        ErrorSeverity.CRITICAL,
        ErrorCategory.AUTHENTICATION
      );

      handler.handleError(error);

      expect(Sentry.setTag).toHaveBeenCalledWith("error.severity", ErrorSeverity.CRITICAL);
      expect(Sentry.setTag).toHaveBeenCalledWith("error.category", ErrorCategory.AUTHENTICATION);
      expect(Sentry.setTag).toHaveBeenCalledWith("error.code", "TEST_ERROR");
    });

    it("should map LOW severity to info level", () => {
      const error = new AppError("Test error", "TEST_ERROR", ErrorSeverity.LOW, ErrorCategory.UI);

      handler.handleError(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        level: "info",
      });
    });

    it("should map MEDIUM severity to warning level", () => {
      const error = new AppError(
        "Test error",
        "TEST_ERROR",
        ErrorSeverity.MEDIUM,
        ErrorCategory.UI
      );

      handler.handleError(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        level: "warning",
      });
    });

    it("should map HIGH severity to error level", () => {
      const error = new AppError("Test error", "TEST_ERROR", ErrorSeverity.HIGH, ErrorCategory.UI);

      handler.handleError(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        level: "error",
      });
    });

    it("should map CRITICAL severity to fatal level", () => {
      const error = new AppError(
        "Test error",
        "TEST_ERROR",
        ErrorSeverity.CRITICAL,
        ErrorCategory.UI
      );

      handler.handleError(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        level: "fatal",
      });
    });

    it("should capture originalError if present", () => {
      const originalError = new Error("Original error");
      const error = new AppError(
        "Test error",
        "TEST_ERROR",
        ErrorSeverity.HIGH,
        ErrorCategory.API,
        "API error",
        {},
        originalError
      );

      handler.handleError(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(originalError, {
        level: "error",
      });
    });

    it("should capture AppError when no originalError exists", () => {
      const error = new AppError("Test error", "TEST_ERROR", ErrorSeverity.HIGH, ErrorCategory.API);

      handler.handleError(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        level: "error",
      });
    });
  });
});
