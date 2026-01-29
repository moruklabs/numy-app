/**
 * Tests for package exports
 */

import * as aiPackage from "../index";

describe("@moruk/ai exports", () => {
  describe("types", () => {
    it("should export DEFAULT_AI_CONFIG", () => {
      expect(aiPackage.DEFAULT_AI_CONFIG).toBeDefined();
      expect(aiPackage.DEFAULT_AI_CONFIG.geminiApiUrl).toBeDefined();
      expect(aiPackage.DEFAULT_AI_CONFIG.timeoutMs).toBeDefined();
      expect(aiPackage.DEFAULT_AI_CONFIG.defaultPrompt).toBeDefined();
    });
  });

  describe("services", () => {
    it("should export AppleService class", () => {
      expect(aiPackage.AppleService).toBeDefined();
      expect(typeof aiPackage.AppleService).toBe("function");
    });

    it("should export GeminiService class", () => {
      expect(aiPackage.GeminiService).toBeDefined();
      expect(typeof aiPackage.GeminiService).toBe("function");
    });
  });

  describe("AI class and helpers", () => {
    it("should export AI class", () => {
      expect(aiPackage.AI).toBeDefined();
      expect(typeof aiPackage.AI).toBe("function");
    });

    it("should export getAI function", () => {
      expect(aiPackage.getAI).toBeDefined();
      expect(typeof aiPackage.getAI).toBe("function");
    });

    it("should export processWithAI function", () => {
      expect(aiPackage.processWithAI).toBeDefined();
      expect(typeof aiPackage.processWithAI).toBe("function");
    });
  });

  describe("provider detection", () => {
    it("should export getAIProvider function", () => {
      expect(aiPackage.getAIProvider).toBeDefined();
      expect(typeof aiPackage.getAIProvider).toBe("function");
    });

    it("should export getAIProviderInfo function", () => {
      expect(aiPackage.getAIProviderInfo).toBeDefined();
      expect(typeof aiPackage.getAIProviderInfo).toBe("function");
    });
  });

  describe("instantiation", () => {
    it("should be able to instantiate AppleService", () => {
      const service = new aiPackage.AppleService();
      expect(service).toBeInstanceOf(aiPackage.AppleService);
    });

    it("should be able to instantiate GeminiService", () => {
      const service = new aiPackage.GeminiService();
      expect(service).toBeInstanceOf(aiPackage.GeminiService);
    });

    it("should be able to instantiate AI", () => {
      const ai = new aiPackage.AI();
      expect(ai).toBeInstanceOf(aiPackage.AI);
    });
  });
});
