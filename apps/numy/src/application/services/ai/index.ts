/**
 * AI Calculation Service
 *
 * Re-exports from @moruk/ai package with numy-specific prompts.
 */

export { CALCULATION_PROMPT } from "./prompts";

// Re-export common types and functions from @moruk/ai
export {
  processWithAI,
  getAIProvider,
  getAIProviderInfo,
  AI,
  type AIRequest,
  type AIResponse,
  type AIProviderInfo,
} from "@moruk/ai";
