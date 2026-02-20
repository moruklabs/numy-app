// Initialize i18n first, before any other imports that might use translations
import "../src/i18n";

import { OnboardingFlow, useOnboardingState } from "@/features/onboarding";
import { useGhostATTListener, usePrivacySequence } from "@/features/privacy";
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
import { useEffect } from "react";
import { AppState, type AppStateStatus, Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import settings from "@/config/settings";

Sentry.init({
  dsn: "https://fc334c47ed5d1e6b4be2302e4b5bd93c@o4510417138352128.ingest.de.sentry.io/4510812305358928",
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
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

function MainLayout() {
  // Initialize privacy sequence (UMP -> ATT) only after onboarding
  usePrivacySequence();
  // Initialize Ghost ATT Listener
  useGhostATTListener();

  // --- OTA Update Check ---
  useEffect(() => {
    if (__DEV__) return;
    const lastCheck = { current: 0 };
    const check = async () => {
      const now = Date.now();
      if (now - lastCheck.current < 5 * 60 * 1000) return;
      lastCheck.current = now;
      try {
        const Updates = await import("expo-updates");
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) await Updates.fetchUpdateAsync();
      } catch (_) {}
    };
    check();
    const sub = AppState.addEventListener("change", (s: AppStateStatus) => {
      if (s === "active") check();
    });
    return () => sub.remove();
  }, []);

  // --- App Open Ad ---
  useEffect(() => {
    if (__DEV__ || !settings.features.showAppOpenAd) return;
    const adUnitId =
      Platform.OS === "ios" ? settings.ads.units.ios.appOpen : settings.ads.units.android.appOpen;
    if (!adUnitId) return;
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        const { AppOpenAd, AdEventType } = await import("react-native-google-mobile-ads");
        const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
        const KEY = "@numy:app_open_last_shown";
        const today = new Date().toISOString().split("T")[0];
        const showIfOk = async (ad: any) => {
          const last = await AsyncStorage.getItem(KEY);
          if (last === today) return;
          ad.show();
          await AsyncStorage.setItem(KEY, today);
        };
        const ad = AppOpenAd.createForAdRequest(adUnitId);
        ad.addAdEventListener(AdEventType.LOADED, () => showIfOk(ad));
        ad.load();
        const sub = AppState.addEventListener("change", (s: AppStateStatus) => {
          if (s === "active") showIfOk(ad).catch(() => {});
        });
        cleanup = () => sub.remove();
      } catch (_) {}
    })();
    return () => cleanup?.();
  }, []);

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
}

export default Sentry.wrap(function RootLayout() {
  const { hasSeenOnboarding } = useOnboardingState();

  // Initialize analytics
  useAnalytics();

  if (!hasSeenOnboarding) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <OnboardingFlow onComplete={() => {}} />
      </View>
    );
  }

  return <MainLayout />;

  // --- OTA + App Open Ad hooks are in MainLayout below ---
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
