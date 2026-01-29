# @moruk/gemini-client

Gemini API client for the moruk.workers.dev proxy. Provides a TypeScript client for text generation and image analysis using Google's Gemini AI.

## Installation

This package is part of the moruk monorepo and is automatically available to all apps in the workspace.

```bash
# In your app's package.json dependencies
{
  "dependencies": {
    "@moruk/gemini-client": "1.0.0"
  }
}
```

## Usage

### Basic Text Generation

Use the default client instance for simple text generation:

```tsx
import { geminiClient } from "@moruk/gemini-client";

// Generate text from a prompt
const response = await geminiClient.generateText("Explain quantum computing in simple terms");
console.log(response);
```

### Image Analysis

Analyze images with custom prompts:

```tsx
import { geminiClient } from "@moruk/gemini-client";
import type { ImageData } from "@moruk/gemini-client";

const images: ImageData[] = [
  {
    base64: "base64-encoded-image-data",
    mimeType: "image/jpeg",
  },
];

const result = await geminiClient.analyzeImages(images, "Describe what you see in this image");
```

### Custom Configuration

Create a custom client instance with specific settings:

```tsx
import { GeminiClient } from "@moruk/gemini-client";

// Backwards-compatible: appName is optional but recommended.
const client = new GeminiClient({
  baseUrl: "https://gemini-api.moruk.workers.dev", // default
  debug: true,
  defaultTemperature: 0.9,
  defaultMaxTokens: 4096,
});

const response = await client.generateText("Hello, Gemini!");
```

Or, for new apps, prefer binding a client to a specific app identifier:

```tsx
import { createGeminiClientForApp } from "@moruk/gemini-client";

// Recommended: explicit app identity for observability and per-app policies
const client = createGeminiClientForApp("ai.moruk.myapp", {
  debug: true,
});

const response = await client.generateText("Hello, Gemini!");
```

### Structured Output

Parse JSON responses from the API:

```tsx
import { geminiClient } from "@moruk/gemini-client";

interface CoinInfo {
  name: string;
  denomination: string;
  country: string;
  year: number;
}

const result = await geminiClient.analyzeImages<CoinInfo>(
  images,
  "Identify this coin and return JSON with name, denomination, country, and year",
  {
    temperature: 0.3,
    responseFormat: "json",
  }
);

console.log(result.name); // Type-safe access
```

### Health Check

Check if the API is available:

```tsx
import { geminiClient } from "@moruk/gemini-client";

const health = await geminiClient.healthCheck();
console.log(health); // { status: "ok", timestamp: "..." }
```

## API

### GeminiClient

Main client class for interacting with the Gemini API.

#### Constructor

```typescript
constructor(config?: GeminiClientConfig)
```

**Config Options:**

- `baseUrl?: string` - API base URL (default: `https://gemini-api.moruk.workers.dev`)
- `debug?: boolean` - Enable debug logging (default: `false`)
- `defaultTemperature?: number` - Default temperature (default: `0.7`)
- `defaultMaxTokens?: number` - Default max tokens (default: `8192`)
- `retry?: RetryConfig` - Retry configuration with fallback models

### Retry and Model Fallback

Model-level retries and multi-model fallback are implemented **server-side** in the
`cf-gemini-proxy` worker. The client provides only **transport-level** retries to the
worker itself.

```typescript
import { GeminiClient } from "@moruk/gemini-client";

const client = new GeminiClient({
  retry: {
    maxRetries: 1, // Optional: retry once on network/transport errors to the worker
    baseDelayMs: 1000, // Base delay for exponential backoff (default: 1000)
    // fallbackModels is deprecated and ignored by the client; the worker controls
    // which Gemini models are used on each retry.
  },
});
```

On the worker, you configure:

- `GEMINI_MODEL` – primary model
- `GEMINI_MODEL_FALLBACKS` – comma-separated fallback models, randomly ordered per request
- `GEMINI_MAX_RETRIES` – maximum number of additional model attempts

The worker sets:

- `X-Model` – the actual model that produced the final response
- `X-Retry-Attempts` – number of server-side LLM retries (0 = first attempt)

The client surfaces these via `GenerateResult.model` and `GenerateResult.retryCount`.

**Backwards compatibility:**

- `RetryConfig.fallbackModels` is still present on the type but is ignored by the client.
- Existing code that configures fallback models continues to compile without behavior changes
  (model selection is now owned by the worker).

**Default Fallback Models (Dec 2025, used by the worker):**

1. `gemini-3-flash-preview` - Latest Gemini 3, fast
2. `gemini-3-pro-preview` - Latest Gemini 3, powerful
3. `gemini-2.5-flash` - Stable, fast
4. `gemini-2.5-flash-lite` - Cost-efficient
5. `gemini-2.0-flash` - Legacy fallback

**Retryable Errors:**

- 5xx server errors
- 429 rate limit exceeded
- 408 request timeout
- `UPSTREAM_ERROR` from proxy

### Get Model Metadata

Use the `*WithMetadata` methods to get information about which model succeeded:

```typescript
const result = await client.analyzeImagesWithMetadata(images, prompt, options);

console.log(result.data); // The response
console.log(result.model); // Model that succeeded (e.g., "gemini-2.5-flash")
console.log(result.retryCount); // Number of retries (0 = first attempt)
console.log(result.requestId); // Request ID for debugging
```

#### Methods

##### `healthCheck(): Promise<HealthCheckResult>`

Check API health status.

**Returns:**

```typescript
{
  status: "ok" | "error";
  timestamp: string;
}
```

##### `generateText(prompt: string, options?: GenerateOptions): Promise<string>`

Generate text from a prompt.

**Parameters:**

- `prompt: string` - The prompt text
- `options?: GenerateOptions` - Generation options

**Returns:**

- `Promise<string>` - Generated text response

##### `analyzeImages<T>(images: ImageData[], prompt: string, options?: GenerateOptions): Promise<T>`

Analyze images with a prompt and return structured data.

**Parameters:**

- `images: ImageData[]` - Array of images to analyze
- `prompt: string` - Analysis prompt
- `options?: GenerateOptions` - Generation options

**Returns:**

- `Promise<T>` - Parsed response of type T

##### `generateImage(prompt: string): Promise<ImageGenerationResult>`

Generate an image from a text prompt.

**Parameters:**

- `prompt: string` - Image description prompt

**Returns:**

```typescript
{
  imageUrl: string;
  prompt: string;
}
```

### Default Instance

```typescript
export const geminiClient: GeminiClient;
```

Pre-configured client instance ready to use.

## Types

### GeminiClientConfig

Client configuration options:

```typescript
interface GeminiClientConfig {
  baseUrl?: string;
  debug?: boolean;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
  /** Optional app identifier; recommended for new apps. */
  appName?: string;
  retry?: RetryConfig;
}
```

### GenerateOptions

Options for text/image generation:

```typescript
interface GenerateOptions {
  temperature?: number; // 0.0 to 1.0
  maxOutputTokens?: number; // Max response length
  systemPrompt?: string; // System instructions
  responseMimeType?: string; // e.g. "application/json" for structured output
  enableThinking?: boolean;
  thinkingBudget?: number;
  language?: string;
  heliconeProperties?: Record<string, string>; // Extra Helicone properties
}
```

### ImageData

Image data for analysis:

```typescript
interface ImageData {
  base64: string; // Base64-encoded image
  mimeType?: string; // MIME type (default: "image/jpeg")
}
```

### GeminiRequest

Request payload structure:

```typescript
interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: GeminiGenerationConfig;
}
```

### GeminiResponse

API response structure:

```typescript
interface GeminiResponse {
  candidates: Array<{
    content: GeminiContent;
    finishReason?: string;
  }>;
}
```

### GeminiContent

Content structure for requests/responses:

```typescript
interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}
```

### GeminiPart

Content parts (text or images):

```typescript
type GeminiPart = { text: string } | { inlineData: { data: string; mimeType: string } };
```

### ApiError

Error type for API failures:

```typescript
interface ApiError extends Error {
  code: string;
  statusCode?: number;
  details?: unknown;
}
```

## Error Handling

The client throws `ApiError` instances with detailed error information:

```tsx
import { geminiClient } from "@moruk/gemini-client";
import type { ApiError } from "@moruk/gemini-client";

try {
  const response = await geminiClient.generateText("Hello");
} catch (error) {
  const apiError = error as ApiError;
  console.error("Error:", apiError.message);
  console.error("Code:", apiError.code);
  console.error("Status:", apiError.statusCode);
}
```

## Example: Complete Implementation

```tsx
import { useState } from "react";
import { geminiClient } from "@moruk/gemini-client";
import type { ImageData } from "@moruk/gemini-client";

interface AnalysisResult {
  description: string;
  confidence: number;
}

export function ImageAnalyzer() {
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeImage = async (imageBase64: string) => {
    try {
      const images: ImageData[] = [
        {
          base64: imageBase64,
          mimeType: "image/jpeg",
        },
      ];

      const analysis = await geminiClient.analyzeImages<AnalysisResult>(
        images,
        "Analyze this image and return JSON with description and confidence (0-100)",
        {
          temperature: 0.3,
          responseFormat: "json",
        }
      );

      setResult(analysis);
    } catch (error) {
      console.error("Analysis failed:", error);
    }
  };

  return (
    <View>
      {result && (
        <>
          <Text>{result.description}</Text>
          <Text>Confidence: {result.confidence}%</Text>
        </>
      )}
    </View>
  );
}
```

## API Endpoint

The client connects to the Gemini API proxy:

- **Base URL:** `https://gemini-api.moruk.workers.dev`
- **Documentation:** See `workers/gemini-api/docs/` in the monorepo

## Dependencies

None - this is a standalone client with no external dependencies.
