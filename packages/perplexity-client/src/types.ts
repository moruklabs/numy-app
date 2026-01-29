/**
 * @moruk/perplexity-client types
 */

export interface PerplexityClientConfig {
  baseUrl?: string;
  debug?: boolean;
  appName?: string;
  retry?: RetryConfig;
  adapter?: IPerplexityAdapter;
}

export interface IPerplexityAdapter {
  request(req: {
    endpoint: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
  }): Promise<{
    status: number;
    statusText: string;
    data: any;
    headers?: Record<string, string>;
  }>;
}

export interface RetryConfig {
  maxRetries?: number;
  baseDelayMs?: number;
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  heliconeProperties?: Record<string, string>;
  stream?: boolean;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface PerplexityRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface PerplexityResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GenerateResult<T = string> {
  data: T;
  model: string;
  retryCount: number;
  requestId?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  requestId?: string;
}

export interface HealthCheckResult {
  status: string;
  requestId: string;
}
