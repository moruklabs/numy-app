/**
 * @moruk/ai
 *
 * AI services with Apple Intelligence and Gemini fallback.
 *
 * @example
 * ```typescript
 * import { AI, processWithAI, getAIProviderInfo } from "@moruk/ai";
 *
 * // Using the convenience function
 * const result = await processWithAI({
 *   input: "what is 15% of 200",
 *   systemPrompt: "You are a calculator assistant..."
 * });
 *
 * // Using a custom instance
 * const ai = new AI({ timeoutMs: 5000 });
 * const customResult = await ai.process({ input: "hello" });
 *
 * // Check provider info
 * const info = getAIProviderInfo();
 * console.log(info.displayName); // "Apple Intelligence" or "Gemini AI"
 * ```
 */

// Types
export type {
  AIProvider,
  AIRequest,
  AIResponse,
  AISuccessResponse,
  AIErrorResponse,
  AIError,
  AIErrorCode,
  AIService,
  AIProviderInfo,
  AIConfig,
  AnalysisConfig,
  AnalysisRequest,
  AnalysisResponse,
  AnalysisError,
} from "./types";

export { DEFAULT_AI_CONFIG } from "./types";

// Services
export * from "./apple.service";
export * from "./gemini.service";
export * from "./gateway.service";
export * from "./analysis.service";

// Main AI class and helpers
export { AI, getAI, processWithAI } from "./ai";

// Provider detection
export { getAIProvider, getAIProviderInfo } from "./provider";
