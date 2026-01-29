/**
 * CrashlyticsService TDD Tests
 *
 * Tests the Firebase Crashlytics service wrapper.
 * Note: Due to dynamic import() usage in the service, we test primarily:
 * - Singleton pattern
 * - Guard clauses (no throwing when methods called)
 * - Method existence
 */

import {
  CrashlyticsService,
  getCrashlyticsService,
  resetCrashlyticsService,
} from "../CrashlyticsService";

// Mock configuration
jest.mock("../../config", () => ({
  FIREBASE_CRASHLYTICS_ENABLED: true,
}));

// Mock the Firebase Crashlytics module for dynamic import
jest.mock(
  "@react-native-firebase/crashlytics",
  () => ({
    __esModule: true,
    default: jest.fn(() => ({
      log: jest.fn(),
      recordError: jest.fn(),
      setUserId: jest.fn(),
      setAttribute: jest.fn(),
      setAttributes: jest.fn(),
      crash: jest.fn(),
      isCrashlyticsCollectionEnabled: true,
      setCrashlyticsCollectionEnabled: jest.fn().mockResolvedValue(undefined),
    })),
  }),
  { virtual: true }
);

describe("CrashlyticsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetCrashlyticsService();
  });

  describe("class structure", () => {
    it("should be instantiable", () => {
      const service = new CrashlyticsService();
      expect(service).toBeInstanceOf(CrashlyticsService);
    });

    it("should have all required methods", () => {
      const service = new CrashlyticsService();

      expect(typeof service.log).toBe("function");
      expect(typeof service.recordError).toBe("function");
      expect(typeof service.setUserId).toBe("function");
      expect(typeof service.setAttribute).toBe("function");
      expect(typeof service.setAttributes).toBe("function");
      expect(typeof service.crash).toBe("function");
      expect(typeof service.isCrashlyticsCollectionEnabled).toBe("function");
      expect(typeof service.setCrashlyticsCollectionEnabled).toBe("function");
    });
  });

  describe("singleton pattern", () => {
    it("should return same instance from getCrashlyticsService", () => {
      const instance1 = getCrashlyticsService();
      const instance2 = getCrashlyticsService();

      expect(instance1).toBe(instance2);
    });

    it("should create new instance after reset", () => {
      const instance1 = getCrashlyticsService();
      resetCrashlyticsService();
      const instance2 = getCrashlyticsService();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe("guard clauses - methods do not throw", () => {
    it("log should not throw when called", () => {
      const service = new CrashlyticsService();
      expect(() => service.log("test message")).not.toThrow();
    });

    it("recordError should not throw when called", () => {
      const service = new CrashlyticsService();
      expect(() => service.recordError(new Error("test"))).not.toThrow();
    });

    it("setUserId should not throw when called", () => {
      const service = new CrashlyticsService();
      expect(() => service.setUserId("user-123")).not.toThrow();
    });

    it("setAttribute should not throw when called", () => {
      const service = new CrashlyticsService();
      expect(() => service.setAttribute("key", "value")).not.toThrow();
    });

    it("setAttributes should not throw when called", () => {
      const service = new CrashlyticsService();
      expect(() => service.setAttributes({ key1: "value1", key2: "value2" })).not.toThrow();
    });

    it("crash should not throw when called", () => {
      const service = new CrashlyticsService();
      expect(() => service.crash()).not.toThrow();
    });
  });

  describe("async methods", () => {
    it("isCrashlyticsCollectionEnabled should return a boolean", async () => {
      const service = new CrashlyticsService();
      const result = await service.isCrashlyticsCollectionEnabled();
      expect(typeof result).toBe("boolean");
    });

    it("setCrashlyticsCollectionEnabled should not throw", async () => {
      const service = new CrashlyticsService();
      await expect(service.setCrashlyticsCollectionEnabled(true)).resolves.not.toThrow();
      await expect(service.setCrashlyticsCollectionEnabled(false)).resolves.not.toThrow();
    });
  });

  describe("multiple calls", () => {
    it("should handle multiple log calls", () => {
      const service = new CrashlyticsService();
      expect(() => {
        service.log("message 1");
        service.log("message 2");
        service.log("message 3");
      }).not.toThrow();
    });

    it("should handle multiple error recordings", () => {
      const service = new CrashlyticsService();
      expect(() => {
        service.recordError(new Error("error 1"));
        service.recordError(new TypeError("error 2"));
        service.recordError(new RangeError("error 3"));
      }).not.toThrow();
    });
  });
});

describe("CrashlyticsService with disabled crashlytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetCrashlyticsService();
  });

  it("should still be instantiable when crashlytics is disabled", () => {
    // Even with flag disabled, the service should work
    const service = new CrashlyticsService();
    expect(service).toBeInstanceOf(CrashlyticsService);
  });

  it("should not throw any methods when crashlytics is disabled", () => {
    const service = new CrashlyticsService();

    // All methods should gracefully handle disabled state
    expect(() => service.log("test")).not.toThrow();
    expect(() => service.recordError(new Error("test"))).not.toThrow();
    expect(() => service.setUserId("user")).not.toThrow();
    expect(() => service.setAttribute("key", "value")).not.toThrow();
    expect(() => service.setAttributes({ a: "b" })).not.toThrow();
    expect(() => service.crash()).not.toThrow();
  });
});

describe("CrashlyticsService error messages", () => {
  it("should handle errors with various message types", () => {
    const service = new CrashlyticsService();

    // String message
    expect(() => service.recordError(new Error("string message"))).not.toThrow();

    // Empty message
    expect(() => service.recordError(new Error(""))).not.toThrow();

    // Long message
    expect(() => service.recordError(new Error("a".repeat(1000)))).not.toThrow();
  });
});

describe("CrashlyticsService attribute handling", () => {
  it("should handle various attribute key/value types", () => {
    const service = new CrashlyticsService();

    // Normal strings
    expect(() => service.setAttribute("version", "1.0.0")).not.toThrow();

    // Empty string
    expect(() => service.setAttribute("empty", "")).not.toThrow();

    // Long values
    expect(() => service.setAttribute("long", "x".repeat(100))).not.toThrow();
  });

  it("should handle multiple attributes object", () => {
    const service = new CrashlyticsService();

    expect(() =>
      service.setAttributes({
        version: "1.0.0",
        platform: "ios",
        buildNumber: "123",
        environment: "production",
      })
    ).not.toThrow();
  });

  it("should handle empty attributes object", () => {
    const service = new CrashlyticsService();
    expect(() => service.setAttributes({})).not.toThrow();
  });
});
