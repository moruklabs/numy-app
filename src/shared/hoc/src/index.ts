/**
 * @moruk/hoc
 *
 * Higher-Order Components for React Native apps.
 */

export { withAccessibility } from "./withAccessibility";
export { withKeyboardAvoidance } from "./withKeyboardAvoidance";
export { withSafeArea } from "./withSafeArea";
export { ErrorBoundary, withErrorBoundary, useErrorHandler } from "./ErrorBoundary";
export {
  AppError,
  ErrorSeverity,
  ErrorCategory,
  ConsoleErrorHandler,
  ErrorHandlerChain,
  globalErrorHandler,
} from "./errorHandling";
export type { ErrorHandler, ErrorContext } from "./errorHandling";
export { SentryErrorHandler } from "./SentryErrorHandler";
