/**
 * Gemini API Client
 *
 * Client for the Gemini API proxy at gemini-api.moruk.workers.dev
 * Handles text and image generation with proper error handling.
 */

import type {
  GeminiRequest,
  GeminiResponse,
  GeminiContent,
  GeminiGenerationConfig,
  GeminiClientConfig,
  GenerateOptions,
  GenerateResult,
  ApiError,
  ImageData,
  AudioData,
  ImageGenerationResult,
  HealthCheckResult,
  RetryConfig,
} from "./types";
import { logger } from "@moruk/logger";

/** Default fallback models in order of preference (Dec 2025) */
const DEFAULT_FALLBACK_MODELS = [
  "gemini-3-flash-preview",
  "gemini-3-pro-preview",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
];

export class GeminiClient {
  private baseUrl: string;
  private debug: boolean;
  private defaultTemperature: number;
  private defaultMaxTokens: number;
  private retryConfig: Required<RetryConfig>;
  private appName: string;

  constructor(config: GeminiClientConfig = {}) {
    this.baseUrl = config.baseUrl || "https://gemini-api.moruk.workers.dev";
    this.debug = config.debug ?? false;
    this.defaultTemperature = config.defaultTemperature ?? 0.7;
    this.defaultMaxTokens = config.defaultMaxTokens ?? 8192;
    this.appName = config.appName ?? "ai.moruk.unknown";
    this.retryConfig = {
      maxRetries: config.retry?.maxRetries ?? 0,
      baseDelayMs: config.retry?.baseDelayMs ?? 1000,
      // Ignore fallbackModels (handled by worker) but keep for backwards compatibility
      fallbackModels: config.retry?.fallbackModels ?? DEFAULT_FALLBACK_MODELS,
    };

    if (!config.appName && this.debug) {
      logger.info(
        "GeminiClient created without appName; using generic 'ai.moruk.unknown' identifier."
      );
    }
  }

  /**
   * Sleep for a given number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private getRetryDelay(attempt: number): number {
    const exponentialDelay = this.retryConfig.baseDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 500;
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw this.createError("Health check failed", "HEALTH_CHECK_FAILED", response.status);
    }
    return response.json() as Promise<HealthCheckResult>;
  }

  /**
   * Generate text from a prompt
   * @returns The generated text string
   */
  async generateText(prompt: string, options: GenerateOptions = {}): Promise<string> {
    const result = await this.generateTextWithMetadata(prompt, options);
    return result.data;
  }

  /**
   * Generate text from a prompt with full metadata
   * @returns GenerateResult with text, model used, retry count, etc.
   */
  async generateTextWithMetadata(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<GenerateResult<string>> {
    const contents: GeminiContent[] = [
      {
        role: "user",
        parts: [{ text: this.buildPrompt(prompt, options) }],
      },
    ];

    const { response, model, retryCount, requestId } = await this.generate(contents, options);
    const text = this.extractText(response);

    return {
      data: text,
      model,
      retryCount,
      requestId,
    };
  }

  /**
   * Analyze images with a prompt
   * @returns The parsed response (JSON or text)
   */
  async analyzeImages<T = unknown>(
    images: ImageData[],
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<T> {
    const result = await this.analyzeImagesWithMetadata<T>(images, prompt, options);
    return result.data;
  }

  /**
   * Analyze images with a prompt, returning full metadata
   * @returns GenerateResult with parsed data, model used, retry count, etc.
   */
  async analyzeImagesWithMetadata<T = unknown>(
    images: ImageData[],
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<GenerateResult<T>> {
    if (this.debug) {
      logger.info("Analyzing images:", images.length);
    }

    // Build image parts
    const imageParts = images.map((img) => ({
      inlineData: {
        data: img.base64,
        mimeType: img.mimeType || "image/jpeg",
      },
    }));

    const contents: GeminiContent[] = [
      {
        role: "user",
        parts: [{ text: this.buildPrompt(prompt, options) }, ...imageParts],
      },
    ];

    const { response, model, retryCount, requestId } = await this.generate(
      contents,
      options.responseMimeType === "application/json"
        ? { ...options, responseMimeType: "application/json" }
        : options
    );

    const text = this.extractText(response);

    // Parse JSON if expected
    let data: T;
    if (options.responseMimeType === "application/json") {
      try {
        const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
        data = JSON.parse(cleanJson) as T;
      } catch {
        throw this.createError("Failed to parse AI response as JSON", "PARSE_ERROR");
      }
    } else {
      data = text as unknown as T;
    }

    return {
      data,
      model,
      retryCount,
      requestId,
    };
  }

  /**
   * Analyze audio with a prompt
   * @returns The parsed response (JSON or text)
   */
  async analyzeAudio<T = unknown>(
    audio: AudioData,
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<T> {
    const result = await this.analyzeMultimodalWithMetadata<T>([], [audio], prompt, options);
    return result.data;
  }

  /**
   * Analyze both images and audio with a prompt
   */
  async analyzeMultimodal<T = unknown>(
    images: ImageData[],
    audio: AudioData[],
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<T> {
    const result = await this.analyzeMultimodalWithMetadata<T>(images, audio, prompt, options);
    return result.data;
  }

  /**
   * Analyze multimodal content with full metadata
   */
  async analyzeMultimodalWithMetadata<T = unknown>(
    images: ImageData[],
    audio: AudioData[],
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<GenerateResult<T>> {
    const imageParts = images.map((img) => ({
      inlineData: {
        data: img.base64,
        mimeType: img.mimeType || "image/jpeg",
      },
    }));

    const audioParts = audio.map((aud) => ({
      inlineData: {
        data: aud.base64,
        mimeType: aud.mimeType || "audio/mp3",
      },
    }));

    const contents: GeminiContent[] = [
      {
        role: "user",
        parts: [{ text: this.buildPrompt(prompt, options) }, ...imageParts, ...audioParts],
      },
    ];

    const { response, model, retryCount, requestId } = await this.generate(
      contents,
      options.responseMimeType === "application/json"
        ? { ...options, responseMimeType: "application/json" }
        : options
    );

    const text = this.extractText(response);

    let data: T;
    if (options.responseMimeType === "application/json") {
      try {
        const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
        data = JSON.parse(cleanJson) as T;
      } catch {
        throw this.createError("Failed to parse AI response as JSON", "PARSE_ERROR");
      }
    } else {
      data = text as unknown as T;
    }

    return {
      data,
      model,
      retryCount,
      requestId,
    };
  }

  /**
   * Generate an image from a prompt (returns binary data)
   */
  async generateImage(prompt: string): Promise<ImageGenerationResult> {
    const startTime = Date.now();

    const response = await fetch(`${this.baseUrl}/api/v1/banana`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const latencyMs = Date.now() - startTime;

    if (this.debug) {
      logger.info("Image generation latency:", latencyMs, "ms");
    }

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as {
        error?: { message?: string; code?: string };
      } | null;
      throw this.createError(
        errorBody?.error?.message || "Image generation failed",
        errorBody?.error?.code || "IMAGE_GENERATION_FAILED",
        response.status,
        response.headers.get("X-Request-ID") || undefined
      );
    }

    const data = await response.arrayBuffer();
    return {
      data,
      contentType: response.headers.get("Content-Type") || "image/png",
      description: response.headers.get("X-Image-Description")
        ? decodeURIComponent(response.headers.get("X-Image-Description")!)
        : undefined,
      size: parseInt(response.headers.get("X-Image-Size") || "0", 10),
    };
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(status?: number, code?: string): boolean {
    // Retry on server errors, rate limits, and timeouts
    if (status && status >= 500) return true;
    if (status === 429) return true; // Rate limited
    if (status === 408) return true; // Request timeout
    if (code === "UPSTREAM_ERROR") return true;
    if (code === "TIMEOUT") return true;
    return false;
  }

  /**
   * Low-level generate method with retry support
   */
  private async generate(
    contents: GeminiContent[],
    options: GenerateOptions = {}
  ): Promise<{ response: GeminiResponse; model: string; retryCount: number; requestId?: string }> {
    const generationConfig: GeminiGenerationConfig = {
      temperature: options.temperature ?? this.defaultTemperature,
      maxOutputTokens: options.maxOutputTokens ?? this.defaultMaxTokens,
    };

    if (options.responseMimeType) {
      generationConfig.responseMimeType = options.responseMimeType;
    }

    if (options.enableThinking) {
      generationConfig.thinkingConfig = {
        thinkingBudget: options.thinkingBudget ?? 8192,
      };
    }

    const request: GeminiRequest = {
      contents,
      generationConfig,
    };

    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      // NOTE:
      // LLM/model-level retries are handled by the Gemini worker. The client only
      // performs optional transport-level retries to the worker itself.
      const modelOverride = null;

      // Build headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-App-Name": this.appName,
      };

      // Attach app identity to Helicone
      headers["Helicone-Property-App"] = this.appName;

      // Add custom Helicone properties (caller-specified)
      if (options.heliconeProperties) {
        for (const [key, value] of Object.entries(options.heliconeProperties)) {
          headers[`Helicone-Property-${key}`] = value;
        }
      }

      // Add retry metadata to Helicone (client-transport retries only)
      if (attempt > 0) {
        headers["Helicone-Property-ClientRetryAttempt"] = String(attempt);
      }

      const startTime = Date.now();

      try {
        const response = await fetch(`${this.baseUrl}/api/v1/generate`, {
          method: "POST",
          headers,
          body: JSON.stringify(request),
        });

        const latencyMs = Date.now() - startTime;

        // Extract observability headers
        const requestId = response.headers.get("X-Request-ID") || undefined;
        const responseTime = response.headers.get("X-Response-Time");
        const cacheStatus = response.headers.get("X-Cache-Status");
        const actualModel = response.headers.get("X-Model") || modelOverride || "default";
        const retryHeader = response.headers.get("X-Retry-Attempts");
        const serverRetryCount = retryHeader ? parseInt(retryHeader, 10) : undefined;

        if (this.debug) {
          logger.info("Gemini API response time:", responseTime || `${latencyMs}ms`);
          logger.info("Request ID:", requestId);
          logger.info("Model used:", actualModel);
          if (attempt > 0) {
            logger.info("Retry attempt:", attempt);
          }
          if (cacheStatus) {
            logger.info("Cache status:", cacheStatus);
          }
        }

        if (!response.ok) {
          const errorBody = (await response.json().catch(() => null)) as {
            error?: { message?: string; code?: string };
          } | null;

          const error = this.createError(
            errorBody?.error?.message || `API error: ${response.status}`,
            errorBody?.error?.code || "API_ERROR",
            response.status,
            requestId
          );

          // Check if we should retry
          if (this.isRetryableError(response.status, errorBody?.error?.code)) {
            lastError = error;

            if (attempt < this.retryConfig.maxRetries) {
              const delay = this.getRetryDelay(attempt);
              if (this.debug) {
                logger.info(
                  `Retrying in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})...`
                );
              }
              await this.sleep(delay);
              continue;
            }
          }

          throw error;
        }

        const data = (await response.json()) as GeminiResponse;
        return {
          response: data,
          model: actualModel,
          // Prefer worker-provided retry count when available (LLM-level retries)
          retryCount: serverRetryCount ?? attempt,
          requestId,
        };
      } catch (error) {
        // Handle network errors
        if (error instanceof TypeError && error.message.includes("fetch")) {
          lastError = this.createError("Network error", "NETWORK_ERROR");

          if (attempt < this.retryConfig.maxRetries) {
            const delay = this.getRetryDelay(attempt);
            if (this.debug) {
              logger.info(`Network error, retrying in ${delay}ms...`);
            }
            await this.sleep(delay);
            continue;
          }
        }

        // Re-throw non-network errors
        throw error;
      }
    }

    // All transport-level retries exhausted
    throw lastError || this.createError("All retry attempts failed", "RETRY_EXHAUSTED");
  }

  /**
   * Build prompt with optional system prompt and language
   */
  private buildPrompt(prompt: string, options: GenerateOptions): string {
    let fullPrompt = prompt;

    if (options.systemPrompt) {
      fullPrompt = `${options.systemPrompt}\n\n${prompt}`;
    }

    if (options.language) {
      fullPrompt += `\n\nLanguage for response: ${options.language}`;
    }

    return fullPrompt;
  }

  /**
   * Extract text from Gemini response (handles thinking model responses)
   */
  private extractText(response: GeminiResponse): string {
    if (!response.candidates || response.candidates.length === 0) {
      throw this.createError("No response from AI", "NO_RESPONSE");
    }

    const parts = response.candidates[0]?.content?.parts;
    if (!parts || parts.length === 0) {
      throw this.createError("Empty response from AI", "EMPTY_RESPONSE");
    }

    // Thinking models return multiple parts - find the non-thought part
    for (const part of parts) {
      if (part.text && !part.thought) {
        return part.text;
      }
    }

    // Fallback to last part
    const lastPart = parts[parts.length - 1];
    return lastPart.text || "";
  }

  /**
   * Create a standardized API error
   */
  private createError(
    message: string,
    code?: string,
    status?: number,
    requestId?: string
  ): ApiError {
    return { message, code, status, requestId };
  }
}

/**
 * Default client instance with a generic app name.
 *
 * NOTE: For production apps, prefer creating an app-specific client with a
 * canonical app name instead of using this default instance.
 */
export const geminiClient = new GeminiClient();
