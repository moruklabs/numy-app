import { AI, getAI, processWithAI } from "../ai";
import { AppleService } from "../apple.service";
import { GeminiService } from "../gemini.service";
import { GatewayService } from "../gateway.service";
import * as provider from "../provider";

// Mock the services
jest.mock("../apple.service");
jest.mock("../gemini.service");
jest.mock("../gateway.service");
jest.mock("../provider");

const MockAppleService = AppleService as jest.MockedClass<typeof AppleService>;
const MockGeminiService = GeminiService as jest.MockedClass<typeof GeminiService>;
const MockGatewayService = GatewayService as jest.MockedClass<typeof GatewayService>;
const mockGetAIProvider = provider.getAIProvider as jest.MockedFunction<
  typeof provider.getAIProvider
>;

describe("AI", () => {
  let mockAppleProcess: jest.Mock;
  let mockGeminiProcess: jest.Mock;
  let mockGatewayProcess: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAppleProcess = jest.fn();
    mockGeminiProcess = jest.fn();
    mockGatewayProcess = jest.fn();

    MockAppleService.mockImplementation(
      () =>
        ({
          process: mockAppleProcess,
          isAvailable: jest.fn(),
        }) as unknown as AppleService
    );

    MockGeminiService.mockImplementation(
      () =>
        ({
          process: mockGeminiProcess,
        }) as unknown as GeminiService
    );

    MockGatewayService.mockImplementation(
      () =>
        ({
          process: mockGatewayProcess,
        }) as unknown as GatewayService
    );
  });

  describe("process with Apple provider", () => {
    beforeEach(() => {
      mockGetAIProvider.mockReturnValue("apple");
    });

    it("should return Apple result when successful", async () => {
      const successResult = {
        success: true as const,
        value: 42,
        formatted: "42",
      };
      mockAppleProcess.mockResolvedValue(successResult);

      const ai = new AI();
      const result = await ai.process({ input: "test" });

      expect(result).toEqual(successResult);
      expect(mockAppleProcess).toHaveBeenCalledTimes(1);
      expect(mockGatewayProcess).not.toHaveBeenCalled();
    });

    it("should fallback to Gemini when Apple is not available", async () => {
      const appleError = {
        success: false as const,
        error: { code: "not_available" as const, message: "Not available", retryable: false },
      };
      const geminiSuccess = {
        success: true as const,
        value: 42,
        formatted: "42",
      };

      mockAppleProcess.mockResolvedValue(appleError);
      mockGeminiProcess.mockResolvedValue(geminiSuccess);

      const ai = new AI();
      const result = await ai.process({ input: "test" });

      expect(result).toEqual(geminiSuccess);
      expect(mockAppleProcess).toHaveBeenCalledTimes(1);
      expect(mockGeminiProcess).toHaveBeenCalledTimes(1);
      expect(mockGatewayProcess).not.toHaveBeenCalled();
    });

    it("should fallback to Gateway when Apple has retryable error", async () => {
      const appleError = {
        success: false as const,
        error: { code: "timeout" as const, message: "Timeout", retryable: true },
      };
      const gatewaySuccess = {
        success: true as const,
        value: 42,
        formatted: "42",
      };

      mockAppleProcess.mockResolvedValue(appleError);
      mockGatewayProcess.mockResolvedValue(gatewaySuccess);

      const ai = new AI();
      const result = await ai.process({ input: "test" });

      expect(result).toEqual(gatewaySuccess);
      expect(mockGatewayProcess).toHaveBeenCalledTimes(1);
    });

    it("should return Apple error when Gateway also fails on retryable", async () => {
      const appleError = {
        success: false as const,
        error: { code: "timeout" as const, message: "Apple timeout", retryable: true },
      };
      const gatewayError = {
        success: false as const,
        error: { code: "network" as const, message: "Gateway network error", retryable: true },
      };

      mockAppleProcess.mockResolvedValue(appleError);
      mockGatewayProcess.mockResolvedValue(gatewayError);

      const ai = new AI();
      const result = await ai.process({ input: "test" });

      // Should return original Apple error
      expect(result).toEqual(appleError);
    });

    it("should return Apple error for non-retryable errors without fallback", async () => {
      const appleError = {
        success: false as const,
        error: { code: "not_processable" as const, message: "Cannot process", retryable: false },
      };

      mockAppleProcess.mockResolvedValue(appleError);

      const ai = new AI();
      const result = await ai.process({ input: "test" });

      expect(result).toEqual(appleError);
      expect(mockGatewayProcess).not.toHaveBeenCalled();
      expect(mockGeminiProcess).not.toHaveBeenCalled();
    });
  });

  describe("process with Gateway provider (default/fallback)", () => {
    beforeEach(() => {
      mockGetAIProvider.mockReturnValue("gemini"); // or gateway, theoretically
    });

    it("should use Gateway directly without trying Apple", async () => {
      const gatewaySuccess = {
        success: true as const,
        value: 42,
        formatted: "42",
      };
      mockGatewayProcess.mockResolvedValue(gatewaySuccess);

      const ai = new AI();
      const result = await ai.process({ input: "test" });

      expect(result).toEqual(gatewaySuccess);
      expect(mockGatewayProcess).toHaveBeenCalledTimes(1);
      expect(mockAppleProcess).not.toHaveBeenCalled();
    });

    it("should return Gateway error when it fails", async () => {
      const gatewayError = {
        success: false as const,
        error: {
          code: "network" as const,
          message: "Check your internet connection and try again",
          retryable: true,
        },
      };
      mockGatewayProcess.mockResolvedValue(gatewayError);

      const ai = new AI();
      const result = await ai.process({ input: "test" });

      expect(result).toEqual(gatewayError);
    });
  });

  describe("processWithApple", () => {
    it("should only use Apple service", async () => {
      mockGetAIProvider.mockReturnValue("gemini");
      const appleSuccess = {
        success: true as const,
        value: 42,
        formatted: "42",
      };
      mockAppleProcess.mockResolvedValue(appleSuccess);

      const ai = new AI();
      const result = await ai.processWithApple({ input: "test" });

      expect(result).toEqual(appleSuccess);
      expect(mockAppleProcess).toHaveBeenCalledTimes(1);
      expect(mockGatewayProcess).not.toHaveBeenCalled();
    });
  });

  describe("processWithGemini", () => {
    it("should only use Gemini service", async () => {
      mockGetAIProvider.mockReturnValue("apple");
      const geminiSuccess = {
        success: true as const,
        value: 42,
        formatted: "42",
      };
      mockGeminiProcess.mockResolvedValue(geminiSuccess);

      const ai = new AI();
      const result = await ai.processWithGemini({ input: "test" });

      expect(result).toEqual(geminiSuccess);
      expect(mockGeminiProcess).toHaveBeenCalledTimes(1);
      expect(mockAppleProcess).not.toHaveBeenCalled();
    });
  });

  describe("getAI", () => {
    it("should return an AI instance", () => {
      const ai = getAI();
      expect(ai).toBeInstanceOf(AI);
    });

    it("should return consistent instance (singleton pattern)", () => {
      const ai1 = getAI();
      const ai2 = getAI();
      // Both calls should return the same singleton
      expect(ai1).toBe(ai2);
    });
  });

  describe("processWithAI", () => {
    it("should be a function", () => {
      expect(typeof processWithAI).toBe("function");
    });

    it("should return a promise", () => {
      mockGetAIProvider.mockReturnValue("gemini");
      const gatewaySuccess = {
        success: true as const,
        value: 42,
        formatted: "42",
      };
      mockGatewayProcess.mockResolvedValue(gatewaySuccess);

      const result = processWithAI({ input: "test" });
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
