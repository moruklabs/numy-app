/* eslint-disable @typescript-eslint/no-explicit-any */

export interface AIRequest {
  input: string;
  systemPrompt?: string;
  [key: string]: any;
}

export interface AIResponse {
  success: boolean;
  value?: number;
  unit?: string;
  error?: string;
  [key: string]: any;
}

export interface AIProviderInfo {
  name: string;
  model: string;
  [key: string]: any;
}

export async function processWithAI(_request: AIRequest): Promise<AIResponse> {
  return { success: false, error: "AI not available in standalone mode" };
}

export function getAIProvider(): string {
  return "none";
}

export function getAIProviderInfo(): AIProviderInfo {
  return { name: "none", model: "none" };
}

export const AI = {
  processWithAI,
  getAIProvider,
  getAIProviderInfo,
};
