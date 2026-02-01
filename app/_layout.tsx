// Initialize i18n first, before any other imports that might use translations
import "../src/i18n";

import { usePrivacySequence } from "@/features/privacy/api/PrivacySequence";
import { useAnalytics } from "@/hooks";
import { colors, typography } from "@/presentation/theme";
import {
  AppError,
  ErrorBoundary,
  ErrorCategory,
  ErrorSeverity,
  globalErrorHandler,
} from "@/shared/hoc";
import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

Sentry.init({
  dsn: "https://fc334c47ed5d1e6b4be2302e4b5bd93c@o4510417138352128.ingest.de.sentry.io/4510812305358928",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// Global unhandled promise rejection handler
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));

  const appError = new AppError(
    error.message || "Unhandled promise rejection",
    "UNHANDLED_PROMISE_REJECTION",
    ErrorSeverity.HIGH,
    ErrorCategory.UNKNOWN,
    "Something went wrong. Please try again.",
    { action: "promiseRejection" },
    error
  );

  globalErrorHandler.handleError(appError);
};

if (globalThis.addEventListener) {
  globalThis.addEventListener("unhandledrejection", handleUnhandledRejection);
}

// React Native global error handler
if (ErrorUtils) {
  const originalHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    const appError = new AppError(
      error.message || "Native error",
      "NATIVE_ERROR",
      isFatal ? ErrorSeverity.CRITICAL : ErrorSeverity.HIGH,
      ErrorCategory.UNKNOWN,
      "A critical error occurred. Please restart the app.",
      { action: "nativeError", isFatal },
      error
    );

    globalErrorHandler.handleError(appError);

    // Call original handler to preserve default behavior
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

export default Sentry.wrap(function RootLayout() {
  // Initialize analytics and track screen views
  useAnalytics();

  // Initialize privacy sequence (UMP -> ATT)
  usePrivacySequence();

  return (
    <View style={styles.container} testID="app.root">
      <StatusBar style="light" />
      <GestureHandlerRootView style={styles.gestureRoot}>
        <ErrorBoundary>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: colors.background.primary,
              },
              headerTintColor: colors.text.primary,
              headerTitleStyle: {
                fontFamily: typography.fonts.mono,
                fontWeight: "600",
              },
              contentStyle: {
                backgroundColor: colors.background.primary,
              },
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
                headerBackVisible: false,
              }}
            />
          </Stack>
        </ErrorBoundary>
      </GestureHandlerRootView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  gestureRoot: {
    flex: 1,
  },
});
