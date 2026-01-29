/**
 * Gemini AI Service
 *
 * Implements AIService using Gemini API via proxy.
 * Serves as fallback when Apple Intelligence is unavailable.
 */

import type { AIService, AIRequest, AIResponse, AIConfig } from "./types";
import { DEFAULT_AI_CONFIG } from "./types";

/** Type for fetch function injection (testability) */
type FetchFn = typeof fetch;

/**
 * Gemini-powered AI service.
 * Uses cloud API via moruk.workers.dev proxy.
 */
export class GeminiService implements AIService {
  private readonly config: Required<AIConfig>;
  private readonly fetchFn: FetchFn;

  constructor(config: AIConfig = {}, fetchFn: FetchFn = fetch) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
    this.fetchFn = fetchFn;
  }

  /**
   * Process input using Gemini API.
   */
  async process(request: AIRequest): Promise<AIResponse> {
    const prompt = this.buildPrompt(request);

    try {
      const response = await this.fetchWithTimeout(prompt);
      return this.parseResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Builds the prompt for Gemini API.
   */
  private buildPrompt(request: AIRequest): string {
    const systemPrompt = request.systemPrompt || this.config.defaultPrompt;

    return `${systemPrompt}

User input: "${request.input}"
${request.context ? `Context: ${request.context}` : ""}

Respond with ONLY a JSON object in this exact format:
{"value": <number or null>, "formatted": "<display string>", "unit": "<unit or null>", "explanation": "<brief explanation>"}

If the input cannot be processed, respond with:
{"error": "not_processable", "message": "<why it cannot be processed>"}`;
  }

  /**
   * Fetches from Gemini API with timeout.
   */
  private async fetchWithTimeout(prompt: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await this.fetchFn(this.config.geminiApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parses Gemini API response.
   */
  private async parseResponse(response: Response): Promise<AIResponse> {
    if (!response.ok) {
      return this.handleHttpError(response.status);
    }

    try {
      const data = await response.json();

      // Extract text from Gemini response format
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text || typeof text !== "string") {
        return {
          success: false,
          error: {
            code: "parse_error",
            message: "No response from Gemini",
            retryable: true,
          },
        };
      }

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Return raw text if no JSON found
        return {
          success: true,
          formatted: text.trim(),
          raw: text,
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Check if AI returned an error
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

      // Return structured response
      return {
        success: true,
        value: typeof parsed.value === "number" ? parsed.value : undefined,
        formatted: parsed.formatted || text.trim(),
        unit: parsed.unit || undefined,
        explanation: parsed.explanation || undefined,
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

  /**
   * Maps HTTP status codes to errors.
   */
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

  /**
   * Handles fetch errors.
   */
  private handleError(error: unknown): AIResponse {
    // AbortController timeout
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

    // Network or other errors
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
