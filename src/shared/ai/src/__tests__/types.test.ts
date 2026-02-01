import {
  DEFAULT_AI_CONFIG,
  type AIProvider,
  type AIRequest,
  type AIResponse,
  type AISuccessResponse,
  type AIErrorResponse,
  type AIError,
  type AIErrorCode,
  type AIProviderInfo,
  type AIConfig,
} from "../types";

describe("types", () => {
  describe("DEFAULT_AI_CONFIG", () => {
    it("should have correct default gemini API URL", () => {
      expect(DEFAULT_AI_CONFIG.geminiApiUrl).toBe(
        "https://gemini-api.moruk.workers.dev/api/v1/generate"
      );
    });

    it("should have correct default timeout", () => {
      expect(DEFAULT_AI_CONFIG.timeoutMs).toBe(10000);
    });

    it("should have a default prompt", () => {
      expect(DEFAULT_AI_CONFIG.defaultPrompt).toBe("You are a helpful AI assistant.");
    });
  });

  describe("type guards", () => {
    it("should correctly identify success response", () => {
      const successResponse: AISuccessResponse = {
        success: true,
        formatted: "42",
        value: 42,
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.formatted).toBe("42");
      expect(successResponse.value).toBe(42);
    });

    it("should correctly identify error response", () => {
      const errorResponse: AIErrorResponse = {
        success: false,
        error: {
          code: "timeout",
          message: "Request timed out",
          retryable: true,
        },
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error.code).toBe("timeout");
      expect(errorResponse.error.retryable).toBe(true);
    });

    it("should handle discriminated union correctly", () => {
      const response: AIResponse = {
        success: true,
        formatted: "result",
      };

      if (response.success) {
        // TypeScript narrows to AISuccessResponse
        expect(response.formatted).toBe("result");
      } else {
        // TypeScript narrows to AIErrorResponse
        expect((response as any).error).toBeDefined();
      }
    });
  });

  describe("AIErrorCode", () => {
    it("should include all expected error codes", () => {
      const codes: AIErrorCode[] = [
        "not_available",
        "timeout",
        "network",
        "rate_limit",
        "parse_error",
        "not_processable",
        "server_error",
      ];

      codes.forEach((code) => {
        const error: AIError = {
          code,
          message: "test",
          retryable: false,
        };
        expect(error.code).toBe(code);
      });
    });
  });

  describe("AIProvider", () => {
    it("should only allow apple or gemini", () => {
      const providers: AIProvider[] = ["apple", "gemini"];
      expect(providers).toHaveLength(2);
      expect(providers).toContain("apple");
      expect(providers).toContain("gemini");
    });
  });

  describe("AIRequest", () => {
    it("should require input", () => {
      const request: AIRequest = {
        input: "test input",
      };
      expect(request.input).toBe("test input");
    });

    it("should allow optional context", () => {
      const request: AIRequest = {
        input: "test",
        context: "additional context",
      };
      expect(request.context).toBe("additional context");
    });

    it("should allow optional systemPrompt", () => {
      const request: AIRequest = {
        input: "test",
        systemPrompt: "You are a calculator",
      };
      expect(request.systemPrompt).toBe("You are a calculator");
    });
  });

  describe("AIProviderInfo", () => {
    it("should contain provider info for apple", () => {
      const info: AIProviderInfo = {
        provider: "apple",
        isOnDevice: true,
        displayName: "Apple Intelligence",
      };
      expect(info.isOnDevice).toBe(true);
    });

    it("should contain provider info for gemini", () => {
      const info: AIProviderInfo = {
        provider: "gemini",
        isOnDevice: false,
        displayName: "Gemini AI",
      };
      expect(info.isOnDevice).toBe(false);
    });
  });

  describe("AIConfig", () => {
    it("should allow partial configuration", () => {
      const config: AIConfig = {
        timeoutMs: 5000,
      };
      expect(config.timeoutMs).toBe(5000);
      expect(config.geminiApiUrl).toBeUndefined();
    });

    it("should allow full configuration", () => {
      const config: AIConfig = {
        geminiApiUrl: "https://custom.api/generate",
        timeoutMs: 15000,
        defaultPrompt: "Custom prompt",
      };
      expect(config.geminiApiUrl).toBe("https://custom.api/generate");
      expect(config.timeoutMs).toBe(15000);
      expect(config.defaultPrompt).toBe("Custom prompt");
    });
  });
});
