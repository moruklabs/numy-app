import {
  createNumericResult,
  createCurrencyResult,
  createUnitResult,
  createPercentageResult,
  createErrorResult,
} from "../value-objects/CalculationResult";
import Decimal from "decimal.js";

describe("CalculationResult Value Object", () => {
  describe("createNumericResult", () => {
    it("creates result from number", () => {
      const result = createNumericResult(42);
      expect(result.type).toBe("number");
      expect(result.value.toNumber()).toBe(42);
      expect(result.formatted).toBe("42");
    });

    it("creates result from Decimal", () => {
      const result = createNumericResult(new Decimal(3.14159));
      expect(result.type).toBe("number");
      expect(result.value.toNumber()).toBeCloseTo(3.14159, 4);
    });

    it("creates result from string", () => {
      const result = createNumericResult("123.45");
      expect(result.value.toNumber()).toBe(123.45);
    });

    it("formats large numbers with commas", () => {
      const result = createNumericResult(1000000);
      expect(result.formatted).toContain("1,000,000");
    });

    it("formats integers without decimals", () => {
      const result = createNumericResult(5.0);
      expect(result.formatted).toBe("5");
    });

    it("formats floats with 2 decimal places by default", () => {
      const result = createNumericResult(3.14159);
      expect(result.formatted).toBe("3.14"); // Default: 2 decimals for floats
    });

    it("respects custom decimal places", () => {
      const result = createNumericResult(3.14159, { decimalPlaces: 4 });
      expect(result.formatted).toBe("3.1416");
    });
  });

  describe("createCurrencyResult", () => {
    it("creates USD currency result", () => {
      const result = createCurrencyResult(100, "USD");
      expect(result.type).toBe("currency");
      expect(result.currency).toBe("USD");
      expect(result.formatted).toBe("$100.00");
    });

    it("creates EUR currency result", () => {
      const result = createCurrencyResult(50, "EUR");
      expect(result.type).toBe("currency");
      expect(result.currency).toBe("EUR");
      expect(result.formatted).toContain("€");
    });

    it("creates GBP currency result", () => {
      const result = createCurrencyResult(75.5, "GBP");
      expect(result.type).toBe("currency");
      expect(result.formatted).toContain("£");
    });

    it("creates JPY currency result", () => {
      const result = createCurrencyResult(1000, "JPY");
      expect(result.type).toBe("currency");
      expect(result.formatted).toContain("¥");
    });

    it("formats with 2 decimal places", () => {
      const result = createCurrencyResult(99.9, "USD");
      expect(result.formatted).toBe("$99.90");
    });
  });

  describe("createUnitResult", () => {
    it("creates unit result with integer (no decimals)", () => {
      const result = createUnitResult(10, "cm");
      expect(result.type).toBe("unit");
      expect(result.unit).toBe("cm");
      expect(result.formatted).toBe("10 cm"); // Integers show 0 decimals
    });

    it("formats float with 2 decimal places by default", () => {
      const result = createUnitResult(3.14159, "inches");
      expect(result.formatted).toBe("3.14 inches"); // Default: 2 decimals for floats
    });

    it("respects custom decimal places", () => {
      const result = createUnitResult(3.14159, "inches", { decimalPlaces: 4 });
      expect(result.formatted).toBe("3.1416 inches");
    });
  });

  describe("createPercentageResult", () => {
    it("creates percentage result", () => {
      const result = createPercentageResult(50);
      expect(result.type).toBe("percentage");
      expect(result.value.toNumber()).toBe(50);
      expect(result.formatted).toContain("%");
    });

    it("formats percentage with value", () => {
      const result = createPercentageResult(25.5);
      expect(result.formatted).toBe("25.50 %"); // Default: 2 decimal places for floats
    });
  });

  describe("createErrorResult", () => {
    it("creates error result with message", () => {
      const result = createErrorResult("Division by zero");
      expect(result.type).toBe("error");
      expect(result.error).toBe("Division by zero");
      expect(result.formatted).toBe("Division by zero");
    });

    it("sets value to zero for errors", () => {
      const result = createErrorResult("Invalid input");
      expect(result.value.toNumber()).toBe(0);
    });

    it("handles empty error message", () => {
      const result = createErrorResult("");
      expect(result.type).toBe("error");
      expect(result.error).toBe("");
    });
  });
});
