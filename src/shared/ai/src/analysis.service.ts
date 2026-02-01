import { AnalysisRequest, AnalysisResponse, AnalysisError } from "./types";
import { logger } from "@moruk/logger";
import { geminiClient } from "@moruk/gemini-client";

/**
 * Generic service for analyzing images using a proxy worker (Gemini).
 * This service is agnostic to the domain (Coin, Stone, etc.).
 */
export class AnalysisService {
  /**
   * Analyze images with the provided configuration.
   */
  static async analyze<T = any>(request: AnalysisRequest): Promise<AnalysisResponse<T>> {
    const { images, audio, config, context, language = "English" } = request;

    try {
      if (!images || images.length === 0) {
        throw { message: "No images provided", code: "NO_IMAGES" } as AnalysisError;
      }

      // Construct the full prompt
      let fullPrompt = config.systemPrompt;
      if (config.schema) {
        fullPrompt += `\n\nReturn response in this exact JSON structure: ${JSON.stringify(
          config.schema,
          null,
          2
        )}`;
      }

      const result = await geminiClient.analyzeMultimodalWithMetadata<T>(
        images,
        audio || [],
        fullPrompt,
        {
          responseMimeType: "application/json",
          language,
          // If context is provided, we can pass it as a Helicone property or append to prompt
          // Here we'll append to prompt as it's more direct for the AI
          systemPrompt: context ? `Additional context: ${context}` : undefined,
          heliconeProperties: {
            App: "analysis-service",
          },
        }
      );

      return {
        data: result.data,
        raw: JSON.stringify(result.data), // Metadata result doesn't give raw text easily, but we have the parsed data
        usage: {
          promptTokens: 0, // GeminiClient doesn't expose usage metadata directly in GenerateResult yet
          completionTokens: 0,
          totalTokens: 0,
        },
      };
    } catch (error: any) {
      logger.error("[AnalysisService] Error analyzing images:", error);

      if (error.code === "PARSE_ERROR" || error.code === "API_ERROR") {
        throw {
          message: error.message,
          code: error.code,
          originalError: error,
        } as AnalysisError;
      }

      throw {
        message: error.message || "An unexpected error occurred during analysis",
        code: "UNKNOWN_ERROR",
        originalError: error,
      } as AnalysisError;
    }
  }
}
