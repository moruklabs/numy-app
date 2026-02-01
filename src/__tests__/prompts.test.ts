import { describe, expect, it } from "@jest/globals";
import { CALCULATION_PROMPT } from "../services/ai/prompts";

describe("CALCULATION_PROMPT", () => {
  it("should be a non-empty string", () => {
    expect(typeof CALCULATION_PROMPT).toBe("string");
    expect(CALCULATION_PROMPT.length).toBeGreaterThan(0);
  });

  it("should contain instructions for calculator behavior", () => {
    expect(CALCULATION_PROMPT).toContain("calculator");
    expect(CALCULATION_PROMPT).toContain("natural language");
  });

  it("should include example calculations", () => {
    expect(CALCULATION_PROMPT).toContain("15% of 200");
    expect(CALCULATION_PROMPT).toContain("half of 50");
    expect(CALCULATION_PROMPT).toContain("double 25");
  });

  it("should include rules for output formatting", () => {
    expect(CALCULATION_PROMPT).toContain("numeric result");
    expect(CALCULATION_PROMPT).toContain("Format numbers");
  });

  it("should include safety restrictions", () => {
    expect(CALCULATION_PROMPT).toContain("Do NOT");
    expect(CALCULATION_PROMPT).toContain("financial advice");
    expect(CALCULATION_PROMPT).toContain("investment");
  });

  it("should specify to include units when relevant", () => {
    expect(CALCULATION_PROMPT).toContain("units");
  });
});
