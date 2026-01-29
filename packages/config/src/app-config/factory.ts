/**
 * App Configuration Factory
 *
 * Factory functions for creating consistent app configurations.
 */

import type { AppConfig, CreateAppConfigOptions } from "./types";
import { defaultSettingsConfig, defaultUIConfig } from "./types";

/**
 * Create an app configuration with sensible defaults
 *
 * @example
 * ```ts
 * import { createAppConfig } from "@moruk/config";
 *
 * export const appConfig = createAppConfig({
 *   appName: "babyglimpse",
 *   appDisplayName: "Numy",
 *   appDescription: "AI-powered coin identification app",
 *   bundleIdentifier: "ai.moruk.babyglimpse",
 *   primaryColor: "#C0C0C0",
 *   settings: {
 *     supportUrl: "https://moruk.link/coin-id/support",
 *     privacyPolicyUrl: "https://moruk.link/coin-id/privacy",
 *   },
 * });
 * ```
 */
export function createAppConfig<
  TExtended extends Record<string, unknown> = Record<string, unknown>,
>(options: CreateAppConfigOptions, extensions?: TExtended): AppConfig<TExtended> {
  const {
    appName,
    appDisplayName,
    appDescription,
    bundleIdentifier,
    appSlug = appName,
    primaryColor,
    secondaryColor = primaryColor,
    backgroundColor = "#FFFFFF",
    ui = {},
    settings = {},
  } = options;

  const baseConfig: AppConfig = {
    appName,
    appDisplayName,
    appDescription,
    appSlug,
    bundleIdentifier,
    primaryColor,
    secondaryColor,
    backgroundColor,
    ui: { ...defaultUIConfig, ...ui },
    settings: { ...defaultSettingsConfig, ...settings },
  };

  if (extensions) {
    return { ...baseConfig, ...extensions } as AppConfig<TExtended>;
  }

  return baseConfig as AppConfig<TExtended>;
}

/**
 * Generate standard URLs for an app based on its domain
 *
 * @example
 * ```ts
 * const urls = generateAppUrls("moruk.link/coin-id");
 * // {
 * //   supportUrl: "https://moruk.link/coin-id/support",
 * //   privacyPolicyUrl: "https://moruk.link/coin-id/privacy-policy",
 * //   termsOfServiceUrl: "https://moruk.link/coin-id/terms-and-conditions",
 * // }
 * ```
 */
export function generateAppUrls(
  domain: string
): Pick<AppConfig["settings"], "supportUrl" | "privacyPolicyUrl" | "termsOfServiceUrl"> {
  const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;
  return {
    supportUrl: `${baseUrl}/support`,
    privacyPolicyUrl: `${baseUrl}/privacy`,
    termsOfServiceUrl: `${baseUrl}/terms`,
  };
}

/**
 * Create a share message for the app
 *
 * @example
 * ```ts
 * const shareMessage = createShareMessage({
 *   appName: "Numy",
 *   tagline: "Identify any coin instantly with AI",
 *   url: "https://moruk.link/coin-id",
 *   emoji: "🪙",
 * });
 * ```
 */
export function createShareMessage(options: {
  appName: string;
  tagline: string;
  url: string;
  emoji?: string;
}): string {
  const { appName, tagline, url, emoji } = options;
  const emojiSuffix = emoji ? ` ${emoji}` : "";
  return `${tagline}. Try ${appName}${emojiSuffix} ${url}`;
}
