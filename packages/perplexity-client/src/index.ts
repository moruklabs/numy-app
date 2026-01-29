/**
 * @moruk/perplexity-client
 *
 * Perplexity API client package for the moruk.workers.dev proxy
 */

import { PerplexityClient, perplexityClient } from "./perplexity-client";
import type { PerplexityClientConfig } from "./types";

export { PerplexityClient, perplexityClient };

/**
 * Helper to create a Perplexity client bound to a specific app.
 */
export function createPerplexityClientForApp(
  appName: string,
  config: Omit<PerplexityClientConfig, "appName"> = {}
) {
  return new PerplexityClient({ ...config, appName });
}

// Types
export type {
  PerplexityClientConfig,
  GenerateOptions,
  RetryConfig,
  ChatMessage,
  PerplexityRequest,
  PerplexityResponse,
  GenerateResult,
  ApiError,
  HealthCheckResult,
} from "./types";
