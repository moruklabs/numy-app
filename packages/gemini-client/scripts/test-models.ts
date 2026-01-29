#!/usr/bin/env npx ts-node
/**
 * Test script to verify Gemini models work against production worker
 *
 * Usage: npx ts-node scripts/test-models.ts
 */

const PROD_URL = "https://gemini-api.moruk.workers.dev/api/v1/generate";
const RATE_LIMIT_BYPASS_TOKEN =
  process.env.RATE_LIMIT_BYPASS_TOKEN || "moruk-bypass-59f812dac08d1246d011cde48d1bafe5";

const MODELS_TO_TEST = [
  // Gemini 3 Preview (Dec 2025)
  "gemini-3-flash-preview",
  "gemini-3-pro-preview",
  // Gemini 2.5 Stable (GA)
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  // Gemini 2.0 Fallback
  "gemini-2.0-flash",
];

const TEST_PAYLOAD = {
  contents: [
    {
      role: "user",
      parts: [{ text: "Say 'Hello' in exactly one word." }],
    },
  ],
  generationConfig: {
    temperature: 0.1,
    maxOutputTokens: 10,
  },
};

interface TestResult {
  model: string;
  status: number;
  success: boolean;
  responseTime: number;
  error?: string;
  response?: string;
}

async function testModel(model: string | null): Promise<TestResult> {
  const modelName = model || "default";
  const startTime = Date.now();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Rate-Limit-Bypass": RATE_LIMIT_BYPASS_TOKEN,
  };

  if (model) {
    headers["X-Model-Override"] = model;
  }

  try {
    const response = await fetch(PROD_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(TEST_PAYLOAD),
    });

    const responseTime = Date.now() - startTime;
    const actualModel = response.headers.get("X-Model") || modelName;

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        model: modelName,
        status: response.status,
        success: false,
        responseTime,
        error: errorBody.slice(0, 200),
      };
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return {
      model: actualModel,
      status: response.status,
      success: true,
      responseTime,
      response: text.trim().slice(0, 50),
    };
  } catch (error) {
    return {
      model: modelName,
      status: 0,
      success: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function main() {
  console.log("🧪 Testing Gemini Models against Production Worker");
  console.log(`📍 Endpoint: ${PROD_URL}\n`);
  console.log("=".repeat(70));

  // Test default model first
  console.log("\n📌 Testing default model (no override)...");
  const defaultResult = await testModel(null);
  printResult(defaultResult);

  // Test each model with override
  console.log("\n📌 Testing models with X-Model-Override header...\n");

  const results: TestResult[] = [defaultResult];

  for (const model of MODELS_TO_TEST) {
    console.log(`Testing: ${model}...`);
    const result = await testModel(model);
    results.push(result);
    printResult(result);

    // Small delay between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 SUMMARY\n");

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total:  ${results.length}`);

  if (failed > 0) {
    console.log("\n❌ Failed models:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${r.model}: ${r.status} - ${r.error?.slice(0, 100)}`);
      });
  }

  // Exit with error code if any failed
  process.exit(failed > 0 ? 1 : 0);
}

function printResult(result: TestResult) {
  const icon = result.success ? "✅" : "❌";
  const status = result.success ? `200 OK` : `${result.status} ERROR`;

  console.log(`${icon} ${result.model.padEnd(25)} ${status.padEnd(12)} ${result.responseTime}ms`);

  if (result.success && result.response) {
    console.log(`   Response: "${result.response}"`);
  }
  if (!result.success && result.error) {
    console.log(`   Error: ${result.error.slice(0, 100)}`);
  }
  console.log("");
}

main().catch(console.error);
