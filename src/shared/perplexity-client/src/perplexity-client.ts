/**
 * Perplexity API Client
 *
 * Client for the Perplexity API proxy at perplexity-api.moruk.workers.dev
 */

import type {
  PerplexityRequest,
  PerplexityClientConfig,
  GenerateOptions,
  GenerateResult,
  ApiError,
  HealthCheckResult,
  RetryConfig,
  ChatMessage,
  IPerplexityAdapter,
} from "./types";

export class PerplexityClient {
  private baseUrl: string;
  private debug: boolean;
  private appName: string;
  private retryConfig: Required<RetryConfig>;
  private adapter?: IPerplexityAdapter;

  constructor(config: PerplexityClientConfig = {}) {
    this.baseUrl = config.baseUrl || "https://perplexity-api.moruk.workers.dev";
    this.debug = config.debug ?? false;
    this.appName = config.appName || "ai.moruk.unknown";
    this.retryConfig = {
      maxRetries: config.retry?.maxRetries ?? 2,
      baseDelayMs: config.retry?.baseDelayMs ?? 1000,
    };
    this.adapter = config.adapter;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getRetryDelay(attempt: number): number {
    return Math.min(
      this.retryConfig.baseDelayMs * Math.pow(2, attempt) + Math.random() * 500,
      30000
    );
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw this.createError("Health check failed", "HEALTH_CHECK_FAILED", response.status);
    }
    return response.json() as Promise<HealthCheckResult>;
  }

  async generateText(prompt: string, options: GenerateOptions = {}): Promise<string> {
    const result = await this.chatWithMetadata([{ role: "user", content: prompt }], options);
    return result.data;
  }

  async chat(messages: ChatMessage[], options: GenerateOptions = {}): Promise<string> {
    const result = await this.chatWithMetadata(messages, options);
    return result.data;
  }

  async chatWithMetadata(
    messages: ChatMessage[],
    options: GenerateOptions = {}
  ): Promise<GenerateResult<string>> {
    const chatMessages = [...messages];
    if (options.systemPrompt) {
      chatMessages.unshift({ role: "system", content: options.systemPrompt });
    }

    const request: PerplexityRequest = {
      model: options.model || "sonar",
      messages: chatMessages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: options.stream,
    };

    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-App-Name": this.appName,
      };

      if (options.heliconeProperties) {
        for (const [key, value] of Object.entries(options.heliconeProperties)) {
          headers[`Helicone-Property-${key}`] = value;
        }
      }

      try {
        let responseData: any;
        let responseStatus: number;
        let requestId: string | undefined;
        let actualModel: string | undefined;

        if (this.adapter) {
          const response = await this.adapter.request({
            endpoint: "/v1/chat/completions",
            method: "POST",
            headers,
            body: request,
          });
          responseStatus = response.status;
          responseData = response.data;
          requestId = response.headers?.["x-request-id"];
          actualModel = response.headers?.["x-model"];
        } else {
          const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
            method: "POST",
            headers,
            body: JSON.stringify(request),
          });
          responseStatus = response.status;
          requestId = response.headers.get("X-Request-ID") || undefined;
          actualModel = response.headers.get("X-Model") || undefined;

          if (response.ok) {
            responseData = await response.json();
          } else {
            responseData = await response.json().catch(() => null);
          }
        }

        if (responseStatus < 200 || responseStatus >= 300) {
          const error = this.createError(
            responseData?.error?.message || `API error: ${responseStatus}`,
            responseData?.error?.code || "API_ERROR",
            responseStatus,
            requestId
          );

          if (this.isRetryableError(responseStatus)) {
            lastError = error;
            if (attempt < this.retryConfig.maxRetries) {
              await this.sleep(this.getRetryDelay(attempt));
              continue;
            }
          }
          throw error;
        }

        return {
          data: responseData.choices[0]?.message?.content || "",
          model: actualModel || request.model,
          retryCount: attempt,
          requestId,
        };
      } catch (error) {
        if (error instanceof TypeError && attempt < this.retryConfig.maxRetries) {
          await this.sleep(this.getRetryDelay(attempt));
          continue;
        }
        throw error;
      }
    }

    throw lastError || this.createError("All retry attempts failed", "RETRY_EXHAUSTED");
  }

  private isRetryableError(status: number): boolean {
    return status >= 500 || status === 429 || status === 408;
  }

  private createError(
    message: string,
    code?: string,
    status?: number,
    requestId?: string
  ): ApiError {
    return { message, code, status, requestId };
  }
}

export const perplexityClient = new PerplexityClient();
