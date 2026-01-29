/**
 * AI Service Types
 *
 * Shared types for AI-powered services with Apple Intelligence
 * and Gemini fallback support.
 */

/** Available AI providers */
export type AIProvider = "apple" | "gemini";

/** Request for AI processing */
export interface AIRequest {
  /** The input to process */
  input: string;
  /** Optional context for the AI */
  context?: string;
  /** System prompt for the AI */
  systemPrompt?: string;
}

/** Successful AI response */
export interface AISuccessResponse {
  success: true;
  /** Numeric value if applicable */
  value?: number;
  /** Formatted display string */
  formatted: string;
  /** Unit if applicable */
  unit?: string;
  /** Brief explanation */
  explanation?: string;
  /** Raw text response */
  raw?: string;
}

/** Error codes for AI operations */
export type AIErrorCode =
  | "not_available"
  | "timeout"
  | "network"
  | "rate_limit"
  | "parse_error"
  | "not_processable"
  | "server_error";

/** AI error details */
export interface AIError {
  /** Error code for programmatic handling */
  code: AIErrorCode;
  /** Human-readable error message */
  message: string;
  /** Whether the operation can be retried */
  retryable: boolean;
}

/** Failed AI response */
export interface AIErrorResponse {
  success: false;
  error: AIError;
}

/** AI operation result */
export type AIResponse = AISuccessResponse | AIErrorResponse;

/** AI service interface for dependency injection */
export interface AIService {
  /** Process input with AI */
  process(request: AIRequest): Promise<AIResponse>;
}

/** Provider information for UI display */
export interface AIProviderInfo {
  /** Active provider */
  provider: AIProvider;
  /** Whether processing happens on-device */
  isOnDevice: boolean;
  /** Display name for UI */
  displayName: string;
}

/** Configuration for AI services */
export interface AIConfig {
  /** Gemini API endpoint URL */
  geminiApiUrl?: string;
  /** AI Gateway endpoint URL */
  gatewayApiUrl?: string;
  /** Timeout in milliseconds */
  timeoutMs?: number;
  /** Default system prompt */
  defaultPrompt?: string;
}

/** Default configuration values */
export const DEFAULT_AI_CONFIG: Required<AIConfig> = {
  geminiApiUrl: "https://gemini-api.moruk.workers.dev/api/v1/generate",
  gatewayApiUrl: "https://gateway.moruk.ai/v1/chat/completions",
  timeoutMs: 10000,
  defaultPrompt: "You are a helpful AI assistant.",
};

// --- Image Analysis Types ---

export interface AnalysisConfig {
  endpoint: string;
  systemPrompt: string;
  schema?: Record<string, any>;
  apiKey?: string;
}

export interface AnalysisImageData {
  base64: string;
  uri?: string;
  mimeType?: string;
}

export interface AnalysisAudioData {
  base64: string;
  uri?: string;
  mimeType?: string;
}

export interface AnalysisRequest {
  images: AnalysisImageData[];
  audio?: AnalysisAudioData[];
  context?: string;
  config: AnalysisConfig;
  language?: string;
}

export interface AnalysisError {
  message: string;
  code: string;
  originalError?: any;
}

export interface AnalysisResponse<T = any> {
  data: T;
  raw: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
