/**
 * AI Service with Fallback
 *
 * Main entry point for AI processing with automatic fallback.
 * Tries Apple Intelligence first, falls back to Gemini if unavailable.
 */

import type { AIService, AIRequest, AIResponse, AIConfig } from "./types";
import { AppleService } from "./apple.service";
import { GeminiService } from "./gemini.service";
import { GatewayService } from "./gateway.service";
import { getAIProvider } from "./provider";

/**
 * AI service with automatic fallback from Apple to Gemini.
 */
export class AI implements AIService {
  private readonly appleService: AppleService;
  private readonly geminiService: GeminiService;
  private readonly gatewayService: GatewayService;

  constructor(config: AIConfig = {}) {
    this.appleService = new AppleService(config);
    this.geminiService = new GeminiService(config);
    // Note: In a real app, we should get the app name from a central config
    this.gatewayService = new GatewayService("mobile-app", config);
  }

  /**
   * Process input with automatic provider selection and fallback.
   *
   * Flow:
   * 1. Try Apple Intelligence if available
   * 2. Fall back to Gemini if Apple fails or is unavailable
   */
  async process(request: AIRequest): Promise<AIResponse> {
    const provider = getAIProvider();

    if (provider === "apple") {
      // Try Apple Intelligence first
      const appleResult = await this.appleService.process(request);

      // If Apple succeeded, return the result
      if (appleResult.success) {
        return appleResult;
      }

      // appleResult is now narrowed to AIErrorResponse
      const { error } = appleResult;

      // If Apple failed due to availability, fall back to Gemini
      if (error.code === "not_available") {
        return this.geminiService.process(request);
      }

      // For retryable errors, also try Gateway as fallback
      if (error.retryable) {
        const gatewayResult = await this.gatewayService.process(request);
        // Return Gateway result if successful, otherwise return original Apple error
        return gatewayResult.success ? gatewayResult : appleResult;
      }

      return appleResult;
    }

    // Gateway is the primary remote provider
    return this.gatewayService.process(request);
  }

  /**
   * Process with Apple Intelligence only (no fallback).
   */
  async processWithApple(request: AIRequest): Promise<AIResponse> {
    return this.appleService.process(request);
  }

  /**
   * Process with Gemini only (no fallback).
   */
  async processWithGemini(request: AIRequest): Promise<AIResponse> {
    return this.geminiService.process(request);
  }
}

// Default singleton instance
let defaultAI: AI | null = null;

/**
 * Gets the default AI instance.
 */
export function getAI(config?: AIConfig): AI {
  if (!defaultAI) {
    defaultAI = new AI(config);
  }
  return defaultAI;
}

/**
 * Convenience function to process with AI using default instance.
 */
export async function processWithAI(request: AIRequest): Promise<AIResponse> {
  return getAI().process(request);
}
