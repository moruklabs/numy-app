import {
  CALCULATION_PROMPT,
  processWithAI,
  getAIProvider,
  getAIProviderInfo,
  AI,
} from "../services/ai";

describe("AI service exports", () => {
  describe("CALCULATION_PROMPT", () => {
    it("should export CALCULATION_PROMPT", () => {
      expect(CALCULATION_PROMPT).toBeDefined();
      expect(typeof CALCULATION_PROMPT).toBe("string");
    });
  });

  describe("@moruk/ai re-exports", () => {
    it("should export processWithAI function", () => {
      expect(processWithAI).toBeDefined();
      expect(typeof processWithAI).toBe("function");
    });

    it("should export getAIProvider function", () => {
      expect(getAIProvider).toBeDefined();
      expect(typeof getAIProvider).toBe("function");
    });

    it("should export getAIProviderInfo function", () => {
      expect(getAIProviderInfo).toBeDefined();
      expect(typeof getAIProviderInfo).toBe("function");
    });

    it("should export AI class", () => {
      expect(AI).toBeDefined();
      expect(typeof AI).toBe("function");
    });
  });

  describe("getAIProvider", () => {
    it("should return either apple or gemini", () => {
      const provider = getAIProvider();
      expect(["apple", "gemini"]).toContain(provider);
    });
  });

  describe("getAIProviderInfo", () => {
    it("should return provider info object", () => {
      const info = getAIProviderInfo();
      expect(info).toHaveProperty("provider");
      expect(info).toHaveProperty("isOnDevice");
      expect(info).toHaveProperty("displayName");
    });

    it("should have boolean isOnDevice", () => {
      const info = getAIProviderInfo();
      expect(typeof info.isOnDevice).toBe("boolean");
    });

    it("should have string displayName", () => {
      const info = getAIProviderInfo();
      expect(typeof info.displayName).toBe("string");
      expect(info.displayName.length).toBeGreaterThan(0);
    });
  });
});
