/**
 * Analytics Service Tests
 *
 * Tests the analytics service no-op implementation.
 */

import {
  AnalyticsEvents,
  ScreenNames,
  type CalculationCategory,
} from "@/domain/types/AnalyticsEvents";

// Mock logger to avoid pulling in React Native / monitoring-client in tests
jest.mock("@moruk/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import analytics service (uses mocked logger under the hood)
import {
  initializeAnalytics,
  logScreenView,
  logCalculationPerformed,
  logInputChanged,
  logLineAdded,
  logLineRemoved,
  logDocumentSaved,
  logDocumentLoaded,
  logDocumentDeleted,
  logDocumentCleared,
  logDocumentTitleChanged,
  logSettingsChanged,
  logEmBaseChanged,
  logPpiBaseChanged,
  logTabChanged,
  logError,
  logCalculationError,
  logAppOpened,
  logAppBackgrounded,
  setUserProperties,
  setAnalyticsCollectionEnabled,
  resetAnalyticsData,
  buildCalculationParams,
  buildDocumentParams,
  isAnalyticsAvailable,
} from "../services/AnalyticsService";

describe("AnalyticsService", () => {
  const originalConsoleLog = console.log;
  const mockConsoleLog = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe("initializeAnalytics", () => {
    it("should return false (analytics not available in no-op mode)", async () => {
      const result = await initializeAnalytics();
      expect(result).toBe(false);
    });
  });

  describe("isAnalyticsAvailable", () => {
    it("should always return false in no-op mode", () => {
      expect(isAnalyticsAvailable()).toBe(false);
    });
  });

  describe("Screen Tracking", () => {
    it("should log screen view without errors", async () => {
      await expect(
        logScreenView({
          screen_name: ScreenNames.CALCULATOR,
          screen_class: "CalculatorScreen",
        })
      ).resolves.not.toThrow();
    });

    it("should handle screen view without screen_class", async () => {
      await expect(
        logScreenView({
          screen_name: ScreenNames.HISTORY,
        })
      ).resolves.not.toThrow();
    });
  });

  describe("Calculator Events", () => {
    it("should log calculation performed event without errors", async () => {
      await expect(
        logCalculationPerformed({
          expression_type: "myCalculations",
          success: true,
          has_currency: false,
          has_unit: false,
          has_percentage: false,
          input_length: 5,
        })
      ).resolves.not.toThrow();
    });

    it("should log input changed event without errors", async () => {
      await expect(
        logInputChanged({
          screen_name: ScreenNames.CALCULATOR,
          input_length: 10,
          has_content: true,
        })
      ).resolves.not.toThrow();
    });

    it("should log line added event without errors", async () => {
      await expect(
        logLineAdded({
          screen_name: ScreenNames.CALCULATOR,
          line_count: 3,
        })
      ).resolves.not.toThrow();
    });

    it("should log line removed event without errors", async () => {
      await expect(
        logLineRemoved({
          screen_name: ScreenNames.CALCULATOR,
          line_count: 2,
        })
      ).resolves.not.toThrow();
    });
  });

  describe("Document Events", () => {
    const documentParams = {
      document_id: "doc-123",
      title_length: 10,
      line_count: 5,
      has_variables: true,
    };

    it("should log document saved event without errors", async () => {
      await expect(logDocumentSaved(documentParams)).resolves.not.toThrow();
    });

    it("should log document loaded event without errors", async () => {
      await expect(logDocumentLoaded(documentParams)).resolves.not.toThrow();
    });

    it("should log document deleted event without errors", async () => {
      await expect(logDocumentDeleted(documentParams)).resolves.not.toThrow();
    });

    it("should log document cleared event without errors", async () => {
      await expect(logDocumentCleared()).resolves.not.toThrow();
    });

    it("should log document title changed event without errors", async () => {
      await expect(
        logDocumentTitleChanged({
          old_title_length: 5,
          new_title_length: 10,
        })
      ).resolves.not.toThrow();
    });
  });

  describe("Settings Events", () => {
    it("should log settings changed event without errors", async () => {
      await expect(
        logSettingsChanged({
          setting_name: "em_base",
          old_value: 16,
          new_value: 18,
        })
      ).resolves.not.toThrow();
    });

    it("should log em base changed event without errors", async () => {
      await expect(logEmBaseChanged(16, 20)).resolves.not.toThrow();
    });

    it("should log ppi base changed event without errors", async () => {
      await expect(logPpiBaseChanged(96, 120)).resolves.not.toThrow();
    });
  });

  describe("Navigation Events", () => {
    it("should log tab changed event without errors", async () => {
      await expect(
        logTabChanged({
          from_tab: ScreenNames.CALCULATOR,
          to_tab: ScreenNames.HISTORY,
        })
      ).resolves.not.toThrow();
    });
  });

  describe("Error Events", () => {
    it("should log error event without errors", async () => {
      await expect(
        logError({
          error_type: "runtime_error",
          error_message: "Something went wrong",
          screen_name: ScreenNames.CALCULATOR,
        })
      ).resolves.not.toThrow();
    });

    it("should log calculation error event without errors", async () => {
      await expect(
        logCalculationError({
          error_message: "Invalid expression",
          input: "abc + xyz",
          screen_name: ScreenNames.CALCULATOR,
        })
      ).resolves.not.toThrow();
    });
  });

  describe("Lifecycle Events", () => {
    it("should log app opened event without errors", async () => {
      await expect(logAppOpened()).resolves.not.toThrow();
    });

    it("should log app backgrounded event without errors", async () => {
      await expect(logAppBackgrounded()).resolves.not.toThrow();
    });
  });

  describe("User Properties", () => {
    it("should set user properties without errors", async () => {
      await expect(
        setUserProperties({
          locale: "en",
          em_base: "16",
          ppi_base: "96",
        })
      ).resolves.not.toThrow();
    });

    it("should handle undefined properties without errors", async () => {
      await expect(
        setUserProperties({
          locale: "en",
          em_base: undefined,
        })
      ).resolves.not.toThrow();
    });
  });

  describe("Analytics Control", () => {
    it("should enable/disable analytics collection without errors", async () => {
      await expect(setAnalyticsCollectionEnabled(true)).resolves.not.toThrow();
      await expect(setAnalyticsCollectionEnabled(false)).resolves.not.toThrow();
    });

    it("should reset analytics data without errors", async () => {
      await expect(resetAnalyticsData()).resolves.not.toThrow();
    });
  });

  describe("Utility Functions", () => {
    describe("buildCalculationParams", () => {
      it("should detect currency symbols", () => {
        const params = buildCalculationParams("$50 + 10", "myCalculations", true);
        expect(params.has_currency).toBe(true);
      });

      it("should detect units", () => {
        const params = buildCalculationParams("100km in miles", "unitConversion", true);
        expect(params.has_unit).toBe(true);
      });

      it("should detect percentages", () => {
        const params = buildCalculationParams("20% of 100", "functions", true);
        expect(params.has_percentage).toBe(true);
      });

      it("should include input length", () => {
        const input = "5 times 3";
        const params = buildCalculationParams(input, "myCalculations", true);
        expect(params.input_length).toBe(input.length);
      });

      it("should include expression type and success", () => {
        const params = buildCalculationParams("abc", "comment", false);
        expect(params.expression_type).toBe("comment");
        expect(params.success).toBe(false);
      });
    });

    describe("buildDocumentParams", () => {
      it("should build correct document parameters", () => {
        const params = buildDocumentParams("doc-123", "My Document", 5, true);

        expect(params).toEqual({
          document_id: "doc-123",
          title_length: 11,
          line_count: 5,
          has_variables: true,
        });
      });
    });
  });
});
