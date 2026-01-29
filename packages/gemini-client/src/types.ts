/**
 * Gemini API Types
 *
 * Type definitions for the Gemini API proxy at gemini-api.moruk.workers.dev
 */

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface GeminiPart {
  text?: string;
  inlineData?: {
    data: string;
    mimeType: string;
  };
  fileData?: {
    fileUri: string;
    mimeType: string;
  };
  thought?: boolean;
}

export interface GeminiGenerationConfig {
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  thinkingConfig?: {
    thinkingBudget?: number;
  };
}

export interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: GeminiGenerationConfig;
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: GeminiPart[];
      role: string;
    };
    finishReason?: string;
  }[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    cachedContentTokenCount?: number;
  };
}

export interface GeminiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId?: string;
    upstreamError?: {
      status: number;
      statusText: string;
      body?: unknown;
    };
  };
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  requestId?: string;
}

export interface AudioData {
  base64: string;
  uri?: string;
  mimeType?: string;
}

export interface ImageData {
  base64: string;
  uri?: string;
  mimeType?: string;
}

export interface RetryConfig {
  /** Maximum number of transport-level retry attempts to the worker (default: 0). */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff (default: 1000). */
  baseDelayMs?: number;
  /**
   * @deprecated Model-level fallback is now handled by the worker. This field is ignored
   * by the client but kept for backwards compatibility.
   */
  fallbackModels?: string[];
}

export interface GeminiClientConfig {
  baseUrl?: string;
  debug?: boolean;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
  /**
   * Application identifier used for observability and server-side policy.
   *
   * This should be a stable, canonical string per app, e.g. "ai.moruk.babyglimpse".
   *
   * If omitted, the client will fall back to a generic app name
   * ("ai.moruk.unknown") for backwards compatibility.
   */
  appName?: string;
  /** Transport-level retry configuration. LLM/model-level retries live in the worker. */
  retry?: RetryConfig;
}

export interface GenerateOptions {
  systemPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  enableThinking?: boolean;
  thinkingBudget?: number;
  language?: string;
  /** Custom Helicone properties to track */
  heliconeProperties?: Record<string, string>;
}

export interface GenerateResult<T = string> {
  /** The generated response */
  data: T;
  /** The model that successfully generated the response */
  model: string;
  /** Number of retries attempted before success */
  retryCount: number;
  /** Request ID from the API */
  requestId?: string;
}

export interface ImageGenerationResult {
  data: ArrayBuffer;
  contentType: string;
  description?: string;
  size?: number;
}

export interface HealthCheckResult {
  status: string;
  model: string;
}
