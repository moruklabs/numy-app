import { GeminiService } from "../gemini.service";
import type { AIRequest } from "../types";

describe("GeminiService", () => {
  const createMockFetch = (response: Partial<Response> & { json?: () => Promise<unknown> }) => {
    return jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      ...response,
    });
  };

  const createGeminiResponse = (text: string) => ({
    candidates: [
      {
        content: {
          parts: [{ text }],
        },
      },
    ],
  });

  describe("process", () => {
    it("should return success response for valid calculation", async () => {
      const mockFetch = createMockFetch({
        json: async () =>
          createGeminiResponse('{"value": 30, "formatted": "30", "explanation": "15% of 200"}'),
      });

      const service = new GeminiService({}, mockFetch);
      const request: AIRequest = { input: "15% of 200" };

      const result = await service.process(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(30);
        expect(result.formatted).toBe("30");
        expect(result.explanation).toBe("15% of 200");
      }
    });

    it("should return success with unit when present", async () => {
      const mockFetch = createMockFetch({
        json: async () =>
          createGeminiResponse('{"value": 7200, "formatted": "7,200 seconds", "unit": "seconds"}'),
      });

      const service = new GeminiService({}, mockFetch);
      const request: AIRequest = { input: "2 hours in seconds" };

      const result = await service.process(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(7200);
        expect(result.unit).toBe("seconds");
      }
    });

    it("should handle AI error response", async () => {
      const mockFetch = createMockFetch({
        json: async () =>
          createGeminiResponse('{"error": "not_processable", "message": "Cannot calculate this"}'),
      });

      const service = new GeminiService({}, mockFetch);
      const request: AIRequest = { input: "random text" };

      const result = await service.process(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("not_processable");
        expect(result.error.message).toBe("Cannot calculate this");
      }
    });

    it("should handle rate limit (429)", async () => {
      const mockFetch = createMockFetch({
        ok: false,
        status: 429,
      });

      const service = new GeminiService({}, mockFetch);
      const request: AIRequest = { input: "test" };

      const result = await service.process(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("rate_limit");
        expect(result.error.retryable).toBe(true);
      }
    });

    it("should handle server error (500)", async () => {
      const mockFetch = createMockFetch({
        ok: false,
        status: 500,
      });

      const service = new GeminiService({}, mockFetch);
      const request: AIRequest = { input: "test" };

      const result = await service.process(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("server_error");
        expect(result.error.retryable).toBe(true);
      }
    });

    it("should handle network error", async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const service = new GeminiService({}, mockFetch);
      const request: AIRequest = { input: "test" };

      const result = await service.process(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("network");
        expect(result.error.retryable).toBe(true);
      }
    });

    it("should handle timeout", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      const mockFetch = jest.fn().mockRejectedValue(abortError);

      const service = new GeminiService({}, mockFetch);
      const request: AIRequest = { input: "test" };

      const result = await service.process(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("timeout");
        expect(result.error.retryable).toBe(true);
      }
    });

    it("should handle empty response", async () => {
      const mockFetch = createMockFetch({
        json: async () => ({ candidates: [] }),
      });

      const service = new GeminiService({}, mockFetch);
      const request: AIRequest = { input: "test" };

      const result = await service.process(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("parse_error");
      }
    });

    it("should handle non-JSON response text", async () => {
      const mockFetch = createMockFetch({
        json: async () => createGeminiResponse("Just a plain text response without JSON"),
      });

      const service = new GeminiService({}, mockFetch);
      const request: AIRequest = { input: "hello" };

      const result = await service.process(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.formatted).toBe("Just a plain text response without JSON");
        expect(result.raw).toBeDefined();
      }
    });

    it("should handle malformed JSON in response", async () => {
      const mockFetch = createMockFetch({
        json: async () => createGeminiResponse('{"value": invalid json}'),
      });

      const service = new GeminiService({}, mockFetch);
      const request: AIRequest = { input: "test" };

      const result = await service.process(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("parse_error");
      }
    });

    it("should include context in prompt when provided", async () => {
      const mockFetch = createMockFetch({
        json: async () => createGeminiResponse('{"value": 42, "formatted": "42"}'),
      });

      const service = new GeminiService({}, mockFetch);
      const request: AIRequest = {
        input: "calculate x",
        context: "x = 42",
      };

      await service.process(request);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.contents[0].parts[0].text).toContain("Context: x = 42");
    });

    it("should use custom systemPrompt when provided", async () => {
      const mockFetch = createMockFetch({
        json: async () => createGeminiResponse('{"value": 1, "formatted": "1"}'),
      });

      const service = new GeminiService({}, mockFetch);
      const request: AIRequest = {
        input: "test",
        systemPrompt: "Custom system prompt",
      };

      await service.process(request);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.contents[0].parts[0].text).toContain("Custom system prompt");
    });

    it("should use custom API URL from config", async () => {
      const customUrl = "https://custom-api.example.com/generate";
      const mockFetch = createMockFetch({
        json: async () => createGeminiResponse('{"value": 1, "formatted": "1"}'),
      });

      const service = new GeminiService({ geminiApiUrl: customUrl }, mockFetch);
      await service.process({ input: "test" });

      expect(mockFetch).toHaveBeenCalledWith(customUrl, expect.any(Object));
    });
  });
});
