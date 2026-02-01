/**
 * @moruk/gemini-client
 *
 * Gemini API client package for the moruk.workers.dev proxy
 */

import { GeminiClient, geminiClient } from "./gemini-client";
import type { GeminiClientConfig } from "./types";

// Re-export client for convenience
export { GeminiClient, geminiClient };

/**
 * Helper to create a Gemini client bound to a specific app.
 * Prefer this over the shared default instance in production apps.
 */
export function createGeminiClientForApp(
  appName: string,
  config: Omit<GeminiClientConfig, "appName"> = {}
) {
  return new GeminiClient({ ...config, appName });
}

// Types
export type {
  // Client configuration
  GeminiClientConfig,
  GenerateOptions,
  RetryConfig,
  // Request/Response types
  GeminiRequest,
  GeminiResponse,
  GeminiContent,
  GeminiPart,
  GeminiGenerationConfig,
  GeminiErrorResponse,
  // Result types
  GenerateResult,
  HealthCheckResult,
  ImageGenerationResult,
  // Common types
  ApiError,
  ImageData,
  AudioData,
} from "./types";
