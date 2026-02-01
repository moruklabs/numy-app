/**
 * Apple Intelligence Service
 *
 * Implements AIService using Apple's on-device AI (iOS 26+).
 * Provides private, fast, on-device processing when available.
 */

import type { AIService, AIRequest, AIResponse, AIConfig } from "./types";
import { DEFAULT_AI_CONFIG } from "./types";

/** Type for the Apple AI module */
interface AppleAIModule {
  isAvailable: () => boolean;
  generateText: (options: {
    systemPrompt: string;
    prompt: string;
    temperature?: number;
  }) => Promise<{ text: string }>;
}

/**
 * Apple Intelligence powered AI service.
 * Uses on-device processing for privacy and speed.
 */
export class AppleService implements AIService {
  private readonly config: Required<AIConfig>;
  private appleAI: AppleAIModule | null = null;

  constructor(config: AIConfig = {}) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
  }

  /**
   * Lazily loads the Apple AI module.
   */
  private getAppleAI(): AppleAIModule | null {
    if (this.appleAI !== null) {
      return this.appleAI;
    }

    try {
      // Dynamic require to handle missing package gracefully
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const module = require("@react-native-ai/apple");
      this.appleAI = module.apple;
      return this.appleAI;
    } catch {
      return null;
    }
  }

  /**
   * Checks if Apple Intelligence is available on this device.
   */
  isAvailable(): boolean {
    try {
      const apple = this.getAppleAI();
      return apple?.isAvailable() ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Process input using Apple Intelligence.
   */
  async process(request: AIRequest): Promise<AIResponse> {
    const apple = this.getAppleAI();

    if (!apple) {
      return {
        success: false,
        error: {
          code: "not_available",
          message: "Apple Intelligence is not available",
          retryable: false,
        },
      };
    }

    if (!apple.isAvailable()) {
      return {
        success: false,
        error: {
          code: "not_available",
          message: "Apple Intelligence is not enabled on this device",
          retryable: false,
        },
      };
    }

    try {
      const result = await this.processWithTimeout(request, apple);
      return this.parseResponse(result.text);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Processes request with timeout.
   */
  private async processWithTimeout(
    request: AIRequest,
    apple: AppleAIModule
  ): Promise<{ text: string }> {
    const systemPrompt = request.systemPrompt || this.config.defaultPrompt;

    const prompt = request.context
      ? `${request.input}\n\nContext: ${request.context}`
      : request.input;

    return Promise.race([
      apple.generateText({
        systemPrompt,
        prompt,
        temperature: 0.3,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), this.config.timeoutMs)
      ),
    ]);
  }

  /**
   * Parses Apple AI response text.
   */
  private parseResponse(text: string): AIResponse {
    if (!text || typeof text !== "string") {
      return {
        success: false,
        error: {
          code: "parse_error",
          message: "No response from Apple Intelligence",
          retryable: true,
        },
      };
    }

    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed.error) {
          return {
            success: false,
            error: {
              code: "not_processable",
              message: parsed.message || "Cannot process this input",
              retryable: false,
            },
          };
        }

        if (typeof parsed.value === "number" && typeof parsed.formatted === "string") {
          return {
            success: true,
            value: parsed.value,
            formatted: parsed.formatted,
            unit: parsed.unit || undefined,
            explanation: parsed.explanation || undefined,
            raw: text,
          };
        }
      } catch {
        // JSON parsing failed, return raw text
      }
    }

    // Return raw text response
    return {
      success: true,
      formatted: text.trim(),
      raw: text,
    };
  }

  /**
   * Handles errors from Apple AI.
   */
  private handleError(error: unknown): AIResponse {
    if (error instanceof Error && error.message === "timeout") {
      return {
        success: false,
        error: {
          code: "timeout",
          message: "Request timed out. Try again?",
          retryable: true,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "server_error",
        message: "Apple Intelligence encountered an error",
        retryable: true,
      },
    };
  }
}
