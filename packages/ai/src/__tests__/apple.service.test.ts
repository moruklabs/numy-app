import { AppleService } from "../apple.service";
import type { AIRequest } from "../types";

// Mock the @react-native-ai/apple module
const mockAppleAI = {
  isAvailable: jest.fn(),
  generateText: jest.fn(),
};

jest.mock(
  "@react-native-ai/apple",
  () => ({
    apple: mockAppleAI,
  }),
  { virtual: true }
);

describe("AppleService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isAvailable", () => {
    it("should return true when Apple AI is available", () => {
      mockAppleAI.isAvailable.mockReturnValue(true);

      const service = new AppleService();
      expect(service.isAvailable()).toBe(true);
    });

    it("should return false when Apple AI is not available", () => {
      mockAppleAI.isAvailable.mockReturnValue(false);

      const service = new AppleService();
      expect(service.isAvailable()).toBe(false);
    });

    it("should return false when module throws error", () => {
      mockAppleAI.isAvailable.mockImplementation(() => {
        throw new Error("Module not available");
      });

      const service = new AppleService();
      expect(service.isAvailable()).toBe(false);
    });
  });

  describe("process", () => {
    it("should return not_available error when Apple AI is not available", async () => {
      mockAppleAI.isAvailable.mockReturnValue(false);

      const service = new AppleService();
      const request: AIRequest = { input: "test" };

      const result = await service.process(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("not_available");
        expect(result.error.retryable).toBe(false);
      }
    });

    it("should return success for valid JSON response", async () => {
      mockAppleAI.isAvailable.mockReturnValue(true);
      mockAppleAI.generateText.mockResolvedValue({
        text: '{"value": 42, "formatted": "42", "explanation": "The answer"}',
      });

      const service = new AppleService();
      const request: AIRequest = { input: "what is the answer" };

      const result = await service.process(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(42);
        expect(result.formatted).toBe("42");
        expect(result.explanation).toBe("The answer");
      }
    });

    it("should return success with unit when present", async () => {
      mockAppleAI.isAvailable.mockReturnValue(true);
      mockAppleAI.generateText.mockResolvedValue({
        text: '{"value": 3600, "formatted": "3,600 seconds", "unit": "seconds"}',
      });

      const service = new AppleService();
      const request: AIRequest = { input: "1 hour in seconds" };

      const result = await service.process(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(3600);
        expect(result.unit).toBe("seconds");
      }
    });

    it("should handle AI error response", async () => {
      mockAppleAI.isAvailable.mockReturnValue(true);
      mockAppleAI.generateText.mockResolvedValue({
        text: '{"error": "not_processable", "message": "Cannot process"}',
      });

      const service = new AppleService();
      const request: AIRequest = { input: "invalid" };

      const result = await service.process(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("not_processable");
      }
    });

    it("should handle plain text response", async () => {
      mockAppleAI.isAvailable.mockReturnValue(true);
      mockAppleAI.generateText.mockResolvedValue({
        text: "Plain text response without JSON",
      });

      const service = new AppleService();
      const request: AIRequest = { input: "hello" };

      const result = await service.process(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.formatted).toBe("Plain text response without JSON");
        expect(result.raw).toBeDefined();
      }
    });

    it("should handle empty response", async () => {
      mockAppleAI.isAvailable.mockReturnValue(true);
      mockAppleAI.generateText.mockResolvedValue({ text: "" });

      const service = new AppleService();
      const request: AIRequest = { input: "test" };

      const result = await service.process(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("parse_error");
        expect(result.error.retryable).toBe(true);
      }
    });

    it("should handle timeout", async () => {
      mockAppleAI.isAvailable.mockReturnValue(true);
      mockAppleAI.generateText.mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 100))
      );

      const service = new AppleService({ timeoutMs: 50 });
      const request: AIRequest = { input: "test" };

      const result = await service.process(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("timeout");
        expect(result.error.retryable).toBe(true);
      }
    });

    it("should handle general error", async () => {
      mockAppleAI.isAvailable.mockReturnValue(true);
      mockAppleAI.generateText.mockRejectedValue(new Error("Unknown error"));

      const service = new AppleService();
      const request: AIRequest = { input: "test" };

      const result = await service.process(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("server_error");
        expect(result.error.retryable).toBe(true);
      }
    });

    it("should include context in prompt when provided", async () => {
      mockAppleAI.isAvailable.mockReturnValue(true);
      mockAppleAI.generateText.mockResolvedValue({
        text: '{"value": 10, "formatted": "10"}',
      });

      const service = new AppleService();
      const request: AIRequest = {
        input: "calculate x",
        context: "x = 10",
      };

      await service.process(request);

      expect(mockAppleAI.generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining("Context: x = 10"),
        })
      );
    });

    it("should use custom systemPrompt when provided", async () => {
      mockAppleAI.isAvailable.mockReturnValue(true);
      mockAppleAI.generateText.mockResolvedValue({
        text: '{"value": 1, "formatted": "1"}',
      });

      const service = new AppleService();
      const request: AIRequest = {
        input: "test",
        systemPrompt: "Custom calculator prompt",
      };

      await service.process(request);

      expect(mockAppleAI.generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: "Custom calculator prompt",
        })
      );
    });

    it("should use default prompt from config when no systemPrompt provided", async () => {
      mockAppleAI.isAvailable.mockReturnValue(true);
      mockAppleAI.generateText.mockResolvedValue({
        text: '{"value": 1, "formatted": "1"}',
      });

      const service = new AppleService({ defaultPrompt: "Default prompt from config" });
      const request: AIRequest = { input: "test" };

      await service.process(request);

      expect(mockAppleAI.generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: "Default prompt from config",
        })
      );
    });
  });
});
