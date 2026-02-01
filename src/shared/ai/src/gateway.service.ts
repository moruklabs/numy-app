/**
 * Gateway AI Service
 *
 * Implements AIService using the central AI Gateway (gateway.moruk.ai).
 * Primary remote provider for all mobile apps.
 */

import type { AIService, AIRequest, AIResponse, AIConfig } from "./types";
import { DEFAULT_AI_CONFIG } from "./types";

/** Type for fetch function injection (testability) */
type FetchFn = typeof fetch;

/**
 * Gateway-powered AI service.
 * Routes through gateway.moruk.ai to various providers.
 */
export class GatewayService implements AIService {
  private readonly config: Required<AIConfig>;
  private readonly fetchFn: FetchFn;
  private readonly appName: string;

  constructor(appName: string, config: AIConfig = {}, fetchFn: FetchFn = fetch) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
    this.fetchFn = fetchFn;
    this.appName = appName;
  }

  /**
   * Process input using AI Gateway.
   */
  async process(request: AIRequest): Promise<AIResponse> {
    const systemPrompt = request.systemPrompt || this.config.defaultPrompt;

    try {
      const response = await this.fetchWithTimeout(systemPrompt, request);
      return this.parseResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Fetches from AI Gateway with timeout.
   */
  private async fetchWithTimeout(systemPrompt: string, request: AIRequest): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    const gatewayUrl = this.config.gatewayApiUrl || "https://gateway.moruk.ai/v1/chat/completions";

    try {
      const response = await this.fetchFn(gatewayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-App-Name": this.appName,
        },
        body: JSON.stringify({
          model: "gpt-4o", // Default model for gateway
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `${request.input}${request.context ? `\n\nContext: ${request.context}` : ""}`,
            },
          ],
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parses AI Gateway response (OpenAI compatible).
   */
  private async parseResponse(response: Response): Promise<AIResponse> {
    if (!response.ok) {
      return this.handleHttpError(response.status);
    }

    try {
      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;

      if (!text || typeof text !== "string") {
        return {
          success: false,
          error: {
            code: "parse_error",
            message: "No response from AI Gateway",
            retryable: true,
          },
        };
      }

      // Check for structured JSON in response
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

          return {
            success: true,
            value: typeof parsed.value === "number" ? parsed.value : undefined,
            formatted: parsed.formatted || text.trim(),
            unit: parsed.unit || undefined,
            explanation: parsed.explanation || undefined,
            raw: text,
          };
        } catch {
          // Fall through to raw text if JSON parsing fails
        }
      }

      return {
        success: true,
        formatted: text.trim(),
        raw: text,
      };
    } catch {
      return {
        success: false,
        error: {
          code: "parse_error",
          message: "Could not parse AI response",
          retryable: false,
        },
      };
    }
  }

  private handleHttpError(status: number): AIResponse {
    if (status === 429) {
      return {
        success: false,
        error: {
          code: "rate_limit",
          message: "Too many requests. Try again in a moment",
          retryable: true,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "server_error",
        message: "Something went wrong. Try again?",
        retryable: true,
      },
    };
  }

  private handleError(error: unknown): AIResponse {
    if (error instanceof Error && error.name === "AbortError") {
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
        code: "network",
        message: "Check your internet connection and try again",
        retryable: true,
      },
    };
  }
}
