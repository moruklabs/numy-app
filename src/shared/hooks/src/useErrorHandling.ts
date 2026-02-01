/**
 * @moruk/hooks - useErrorHandling
 * Standardized error handling hook for identifier apps
 */

import { useCallback, useState } from "react";
import type { TranslateFunction } from "./types";

export interface UseErrorHandlingOptions {
  /** Translation function for error messages */
  t?: TranslateFunction;
  /** Default error message when translation is not available */
  defaultErrorMessage?: string;
}

export interface UseErrorHandlingReturn {
  /** Current error message or null */
  error: string | null;
  /** Set error message directly */
  setError: (error: string | null) => void;
  /** Clear the current error */
  clearError: () => void;
  /** Handle an unknown error and set appropriate message */
  handleError: (error: unknown) => void;
}

/**
 * Hook for standardized error handling across identifier apps
 *
 * @example
 * // With translation function
 * const { error, handleError, clearError } = useErrorHandling({ t });
 *
 * @example
 * // Without translation (uses default message)
 * const { error, handleError } = useErrorHandling();
 */
export const useErrorHandling = (options: UseErrorHandlingOptions = {}): UseErrorHandlingReturn => {
  const { t, defaultErrorMessage = "An error occurred during analysis" } = options;

  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback(
    (err: unknown) => {
      let errorMessage: string;

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (t) {
        errorMessage = t("common.analysisError");
      } else {
        errorMessage = defaultErrorMessage;
      }

      setError(errorMessage);
    },
    [t, defaultErrorMessage]
  );

  return {
    error,
    setError,
    clearError,
    handleError,
  };
};
