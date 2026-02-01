/**
 * Analytics Hook
 *
 * Custom hook for initializing and using Firebase Analytics.
 * Handles screen tracking with Expo Router integration.
 * Subscribes to Zustand store for action tracking.
 */

import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { usePathname, useSegments } from "expo-router";
import { TIMING } from "@/presentation/theme";
import {
  initializeAnalytics,
  logScreenView,
  logTabChanged,
  logAppOpened,
  logAppBackgrounded,
  setUserProperties,
  logCalculationPerformed,
  logInputChanged,
  logLineAdded,
  logLineRemoved,
  logDocumentSaved,
  logDocumentLoaded,
  logDocumentDeleted,
  logDocumentCleared,
  logDocumentTitleChanged,
  logEmBaseChanged,
  logPpiBaseChanged,
  logCalculationError,
  buildCalculationParams,
  buildDocumentParams,
} from "@/infrastructure/services/AnalyticsService";
import {
  ScreenNames,
  type ScreenName,
  type CalculationCategory,
} from "@/domain/types/AnalyticsEvents";
import { useCalculatorStore, type CalculatorState } from "../stores/calculatorStore";
import type { Line } from "@/domain/entities/Line";

// Map route segments to screen names
function getScreenNameFromSegments(segments: string[]): ScreenName {
  const lastSegment = segments[segments.length - 1];

  switch (lastSegment) {
    case "index":
    case "(tabs)":
      return ScreenNames.CALCULATOR;
    case "history":
      return ScreenNames.HISTORY;
    case "settings":
      return ScreenNames.SETTINGS;
    default:
      return ScreenNames.CALCULATOR;
  }
}

/**
 * Hook to initialize analytics and track app lifecycle
 * Use this in the root layout
 */
export function useAnalyticsInit() {
  const hasInitialized = useRef(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Get user settings for user properties
  const emBase = useCalculatorStore((state: CalculatorState) => state.emBase);
  const ppiBase = useCalculatorStore((state: CalculatorState) => state.ppiBase);
  const savedDocumentsCount = useCalculatorStore(
    (state: CalculatorState) => state.savedDocuments.length
  );

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Initialize analytics
    initializeAnalytics().then((success: boolean) => {
      if (success) {
        // Log app opened event
        logAppOpened();

        // Set initial user properties
        setUserProperties({
          em_base: String(emBase),
          ppi_base: String(ppiBase),
          saved_documents_count: String(savedDocumentsCount),
        });
      }
    });
  }, [emBase, ppiBase, savedDocumentsCount]);

  // Track app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        // App is going to background
        logAppBackgrounded();
      } else if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        // App is coming to foreground
        logAppOpened();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);
}

/**
 * Hook to track screen views with Expo Router
 * Use this in the root layout or tab layout
 */
export function useScreenTracking() {
  const pathname = usePathname();
  const segments = useSegments();
  const previousScreen = useRef<ScreenName | null>(null);

  useEffect(() => {
    const currentScreen = getScreenNameFromSegments(segments);

    // Log screen view
    logScreenView({
      screen_name: currentScreen,
      screen_class: currentScreen,
    });

    // Log tab change if we have a previous screen
    if (previousScreen.current && previousScreen.current !== currentScreen) {
      logTabChanged({
        from_tab: previousScreen.current,
        to_tab: currentScreen,
      });
    }

    previousScreen.current = currentScreen;
  }, [pathname, segments]);
}

/**
 * Hook to update user properties when settings change
 */
export function useAnalyticsUserProperties() {
  const emBase = useCalculatorStore((state: CalculatorState) => state.emBase);
  const ppiBase = useCalculatorStore((state: CalculatorState) => state.ppiBase);
  const savedDocumentsCount = useCalculatorStore(
    (state: CalculatorState) => state.savedDocuments.length
  );
  const hasHydrated = useCalculatorStore((state: CalculatorState) => state._hasHydrated);

  const previousValues = useRef({
    emBase: 0,
    ppiBase: 0,
    savedDocumentsCount: 0,
  });

  useEffect(() => {
    // Only update after hydration and when values actually change
    if (!hasHydrated) return;

    const hasChanged =
      previousValues.current.emBase !== emBase ||
      previousValues.current.ppiBase !== ppiBase ||
      previousValues.current.savedDocumentsCount !== savedDocumentsCount;

    if (hasChanged) {
      setUserProperties({
        em_base: String(emBase),
        ppi_base: String(ppiBase),
        saved_documents_count: String(savedDocumentsCount),
      });

      previousValues.current = { emBase, ppiBase, savedDocumentsCount };
    }
  }, [emBase, ppiBase, savedDocumentsCount, hasHydrated]);
}

/**
 * Hook to track store state changes for analytics
 * Subscribes to Zustand store and logs relevant events
 */
export function useStoreAnalytics() {
  const inputDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousStateRef = useRef<{
    documentId: string;
    documentTitle: string;
    lineCount: number;
    savedDocsCount: number;
    emBase: number;
    ppiBase: number;
    lineResults: Map<string, string>;
  } | null>(null);

  useEffect(() => {
    // Subscribe to store changes
    const unsubscribe = useCalculatorStore.subscribe((state, prevState) => {
      // Initialize previous state on first run
      if (!previousStateRef.current) {
        previousStateRef.current = {
          documentId: state.document.id,
          documentTitle: state.document.title,
          lineCount: state.document.lines.length,
          savedDocsCount: state.savedDocuments.length,
          emBase: state.emBase,
          ppiBase: state.ppiBase,
          lineResults: new Map(
            state.document.lines.map((l: Line) => [l.id, l.result?.formatted || ""])
          ),
        };
        return;
      }

      const prev = previousStateRef.current;

      // Track line count changes
      const currentLineCount = state.document.lines.length;
      if (currentLineCount > prev.lineCount) {
        logLineAdded({
          screen_name: ScreenNames.CALCULATOR,
          line_count: currentLineCount,
        });
      } else if (currentLineCount < prev.lineCount) {
        logLineRemoved({
          screen_name: ScreenNames.CALCULATOR,
          line_count: currentLineCount,
        });
      }

      // Track calculation results
      for (const line of state.document.lines) {
        const prevResult = prev.lineResults.get(line.id);
        const currentResult = line.result?.formatted || "";

        if (line.result && currentResult && prevResult !== currentResult) {
          const category = (line.category || "myCalculations") as CalculationCategory;
          const success = line.result.type !== "error";

          if (success) {
            logCalculationPerformed(buildCalculationParams(line.input, category, true));
          } else {
            logCalculationError({
              error_message: line.result.error || "Calculation error",
              input: line.input,
              screen_name: ScreenNames.CALCULATOR,
            });
          }
        }

        // Track input changes (debounced)
        const prevLine = prevState?.document.lines.find((l: Line) => l.id === line.id);
        if (prevLine && prevLine.input !== line.input) {
          if (inputDebounceRef.current) {
            clearTimeout(inputDebounceRef.current);
          }
          inputDebounceRef.current = setTimeout(() => {
            logInputChanged({
              screen_name: ScreenNames.CALCULATOR,
              input_length: line.input.length,
              has_content: line.input.trim().length > 0,
            });
          }, TIMING.DEBOUNCE_ANALYTICS_MS);
        }
      }

      // Track document changes
      if (prev.documentId !== state.document.id) {
        if (state.document.title === "Calculator" && state.document.lines.length === 1) {
          logDocumentCleared();
        } else {
          logDocumentLoaded(
            buildDocumentParams(
              state.document.id,
              state.document.title,
              state.document.lines.length,
              state.document.variables.size > 0
            )
          );
        }
      }

      // Track title changes
      if (prev.documentId === state.document.id && prev.documentTitle !== state.document.title) {
        logDocumentTitleChanged({
          old_title_length: prev.documentTitle.length,
          new_title_length: state.document.title.length,
        });
      }

      // Track saved documents changes
      if (state.savedDocuments.length > prev.savedDocsCount) {
        const newDoc = state.savedDocuments[state.savedDocuments.length - 1];
        if (newDoc) {
          logDocumentSaved(
            buildDocumentParams(
              newDoc.id,
              newDoc.title,
              newDoc.lines.length,
              newDoc.variables.size > 0
            )
          );
        }
      } else if (state.savedDocuments.length < prev.savedDocsCount) {
        // Find deleted document
        const prevIds = new Set(prevState?.savedDocuments.map((d) => d.id) || []);
        const currentIds = new Set(state.savedDocuments.map((d) => d.id));
        const deletedId = [...prevIds].find((id) => !currentIds.has(id));

        if (deletedId && prevState) {
          const deletedDoc = prevState.savedDocuments.find((d) => d.id === deletedId);
          if (deletedDoc) {
            logDocumentDeleted(
              buildDocumentParams(
                deletedDoc.id,
                deletedDoc.title,
                deletedDoc.lines.length,
                deletedDoc.variables.size > 0
              )
            );
          }
        }
      }

      // Track settings changes
      if (prev.emBase !== state.emBase) {
        logEmBaseChanged(prev.emBase, state.emBase);
      }
      if (prev.ppiBase !== state.ppiBase) {
        logPpiBaseChanged(prev.ppiBase, state.ppiBase);
      }

      // Update previous state
      previousStateRef.current = {
        documentId: state.document.id,
        documentTitle: state.document.title,
        lineCount: state.document.lines.length,
        savedDocsCount: state.savedDocuments.length,
        emBase: state.emBase,
        ppiBase: state.ppiBase,
        lineResults: new Map(
          state.document.lines.map((l: Line) => [l.id, l.result?.formatted || ""])
        ),
      };
    });

    return () => {
      unsubscribe();
      if (inputDebounceRef.current) {
        clearTimeout(inputDebounceRef.current);
      }
    };
  }, []);
}

/**
 * Combined hook for complete analytics setup
 * Use this in the root layout
 */
export function useAnalytics() {
  useAnalyticsInit();
  useScreenTracking();
  useAnalyticsUserProperties();
  useStoreAnalytics();
}
