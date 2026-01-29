/**
 * AI Provider Detection
 *
 * Detects which AI provider is available on the device.
 * Returns 'apple' when Apple Intelligence is available,
 * 'gemini' as fallback for devices without Apple Intelligence.
 */

import type { AIProvider, AIProviderInfo } from "./types";
import { AppleService } from "./apple.service";

// Singleton Apple service for availability checking
let appleService: AppleService | null = null;

/**
 * Gets or creates Apple service instance.
 */
function getAppleService(): AppleService {
  if (!appleService) {
    appleService = new AppleService();
  }
  return appleService;
}

/**
 * Checks if Apple Intelligence is available on the current device.
 *
 * Requirements per Apple documentation:
 * - iOS 26+
 * - Apple Intelligence enabled in device settings
 * - Supported device hardware
 */
function isAppleIntelligenceAvailable(): boolean {
  try {
    return getAppleService().isAvailable();
  } catch {
    return false;
  }
}

/**
 * Returns the active AI provider based on device capabilities.
 *
 * @returns The AI provider to use ('apple' or 'gemini')
 */
export function getAIProvider(): AIProvider {
  return isAppleIntelligenceAvailable() ? "apple" : "gemini";
}

/**
 * Returns complete information about the active AI provider.
 * Used by Settings screens to display provider status.
 *
 * @returns Full provider information including display name and on-device status
 */
export function getAIProviderInfo(): AIProviderInfo {
  const provider = getAIProvider();

  if (provider === "apple") {
    return {
      provider: "apple",
      isOnDevice: true,
      displayName: "Apple Intelligence",
    };
  }

  return {
    provider: "gemini",
    isOnDevice: false,
    displayName: "Gemini AI",
  };
}
