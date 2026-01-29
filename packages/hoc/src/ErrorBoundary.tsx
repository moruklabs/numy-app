import React, { Component, ErrorInfo, ReactNode, useContext } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Theme, ThemeContext } from "@moruk/context";
import { AppError, ErrorCategory, ErrorSeverity, globalErrorHandler } from "./errorHandling";

/**
 * Fallback theme used when ErrorBoundary is rendered outside of ThemeProvider.
 * This prevents crashes when the error fallback tries to use useTheme().
 */
const fallbackTheme: Theme = {
  colors: {
    primary: "#06B6D4",
    primaryDark: "#0891B2",
    primaryLight: "#22D3EE",
    secondary: "#475569",
    secondaryDark: "#334155",
    secondaryLight: "#64748B",
    background: "#0F172A",
    backgroundSecondary: "#020617",
    surface: "#1E293B",
    surfaceSecondary: "#334155",
    text: "#F8FAFC",
    textSecondary: "#94A3B8",
    textTertiary: "#64748B",
    textInverse: "#0F172A",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
    border: "#334155",
    borderLight: "#475569",
    shadow: "rgba(0, 0, 0, 0.5)",
    overlay: "rgba(0, 0, 0, 0.7)",
    divider: "#334155",
    accent: "#22D3EE",
    accentLight: "#67E8F9",
    accentDark: "#0891B2",
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  borderRadius: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, pill: 9999 },
  fontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
  fontWeight: {
    light: "300",
    regular: "400",
    medium: "500",
    semiBold: "600",
    bold: "700",
    extraBold: "800",
  },
  fontFamily: {
    default: "System",
    regular: "System",
    medium: "System",
    semiBold: "System",
    bold: "System",
    extraBold: "System",
  },
  animations: {
    duration: { fast: 150, normal: 300, slow: 500 },
    easing: { easeIn: "ease-in", easeOut: "ease-out", easeInOut: "ease-in-out" },
  },
  shadows: {
    small: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: (string | number)[];
}

interface State {
  hasError: boolean;
  error: AppError | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Convert any error to AppError
    const appError =
      error instanceof AppError
        ? error
        : new AppError(
            error.message || "An unexpected error occurred",
            "COMPONENT_ERROR",
            ErrorSeverity.HIGH,
            ErrorCategory.UI,
            "Something went wrong. Please try again.",
            {
              component: "ErrorBoundary",
              action: "render",
            },
            error
          );

    return {
      hasError: true,
      error: appError,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError =
      this.state.error ||
      new AppError(
        error.message,
        "COMPONENT_ERROR",
        ErrorSeverity.HIGH,
        ErrorCategory.UI,
        undefined,
        {
          component: errorInfo.componentStack || undefined,
          action: "componentDidCatch",
        },
        error
      );

    this.setState({
      errorInfo,
    });

    // Handle the error through global error handler
    globalErrorHandler.handleError(appError);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetOnPropsChange) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  handleReload = () => {
    // In a React Native app, we might want to restart the app
    // For now, we'll just reset the error boundary
    this.resetErrorBoundary();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: AppError | null;
  onRetry: () => void;
  onReload: () => void;
}

/**
 * Safe hook to get theme with fallback.
 * Returns fallback theme if used outside ThemeProvider.
 * Uses useContext directly to avoid the throw behavior of useTheme.
 */
const useSafeTheme = (): Theme => {
  const context = useContext(ThemeContext);
  // If context is undefined (no ThemeProvider above), use fallback
  return context?.theme ?? fallbackTheme;
};

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onRetry, onReload }) => {
  const theme = useSafeTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background,
    },
    errorContainer: {
      backgroundColor: `${theme.colors.error}14`,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.xl,
      marginVertical: theme.spacing.md,
      alignItems: "center",
      width: "100%",
      maxWidth: 400,
      borderWidth: 1,
      borderColor: `${theme.colors.error}33`,
    },
    title: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.bold,
      fontFamily: theme.fontFamily.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      textAlign: "center",
    },
    message: {
      fontSize: theme.fontSize.md,
      color: theme.colors.error,
      textAlign: "center",
      marginBottom: theme.spacing.lg,
      lineHeight: 22,
      fontFamily: theme.fontFamily.regular,
    },
    details: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginBottom: theme.spacing.lg,
      lineHeight: 20,
      fontFamily: theme.fontFamily.regular,
    },
    buttonContainer: {
      flexDirection: "row",
      gap: theme.spacing.md,
      width: "100%",
    },
    button: {
      flex: 1,
      paddingVertical: 13,
      alignItems: "center",
      borderRadius: 14,
      marginHorizontal: 5,
    },
    outlineButton: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
      backgroundColor: "transparent",
    },
    gradientButton: {
      backgroundColor: theme.colors.primary,
    },
    outlineButtonText: {
      color: theme.colors.primary,
      fontWeight: "bold",
      fontSize: 17,
      fontFamily: theme.fontFamily.semiBold,
    },
    gradientButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 17,
      fontFamily: theme.fontFamily.semiBold,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.errorContainer}>
        <Text style={styles.title}>Oops! Something went wrong</Text>

        <Text style={styles.message}>{error?.userMessage || "An unexpected error occurred"}</Text>

        {__DEV__ && error && (
          <Text style={styles.details}>
            {error.message}
            {error.code && ` (${error.code})`}
          </Text>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.outlineButton]}
            onPress={onRetry}
            accessible={true}
            accessibilityLabel="Try again"
            accessibilityHint="Double tap to retry the last action"
            accessibilityRole="button"
          >
            <Text style={styles.outlineButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.gradientButton]}
            onPress={onReload}
            accessible={true}
            accessibilityLabel="Reload app"
            accessibilityHint="Double tap to reload the application"
            accessibilityRole="button"
          >
            <Text style={styles.gradientButtonText}>Reload</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Higher Order Component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// Hook for manual error throwing
export const useErrorHandler = () => {
  return (error: Error | AppError, errorInfo?: Partial<ErrorInfo>) => {
    const appError =
      error instanceof AppError
        ? error
        : new AppError(
            error.message,
            "MANUAL_ERROR",
            ErrorSeverity.MEDIUM,
            ErrorCategory.UI,
            undefined,
            {
              component: "useErrorHandler",
              action: "manual",
            },
            error
          );

    globalErrorHandler.handleError(appError);
    throw appError;
  };
};
