/**
 * Monitor API Client
 *
 * Sends error reports to the Monitor API for centralized logging and Telegram notifications.
 * All operations are fire-and-forget to prevent blocking the main thread.
 */

import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Application from "expo-application";
import { MessageQueue } from "./queue";
import type {
  MonitorClientConfig,
  MonitorErrorReport,
  MonitorErrorContent,
  ReportErrorOptions,
} from "./types.js";

// Cache app info to avoid repeated lookups
let cachedAppInfo: {
  os: "ios" | "android";
  appId: string;
  appVersion: string;
} | null = null;

/**
 * Get app information for error reporting
 */
function getAppInfo(config?: MonitorClientConfig): {
  os: "ios" | "android";
  appId: string;
  appVersion: string;
} {
  if (cachedAppInfo && !config?.appId && !config?.appVersion) {
    return cachedAppInfo;
  }

  const os: "ios" | "android" = Platform.OS === "ios" ? "ios" : "android";
  const appId =
    config?.appId ||
    (os === "ios"
      ? Constants.expoConfig?.ios?.bundleIdentifier
      : Constants.expoConfig?.android?.package) ||
    Application.applicationId ||
    "unknown.app";
  const appVersion =
    config?.appVersion ||
    Application.nativeApplicationVersion ||
    Constants.expoConfig?.version ||
    "1.0.0";

  const info = { os, appId, appVersion };

  if (!config?.appId && !config?.appVersion) {
    cachedAppInfo = info;
  }

  return info;
}

export class MonitorClient {
  private baseUrl: string;
  private config: MonitorClientConfig;
  private queue: MessageQueue;

  constructor(config: MonitorClientConfig = {}) {
    this.baseUrl = config.baseUrl || "https://monitor-api.moruk.workers.dev";
    this.config = config;
    this.queue = new MessageQueue({
      maxMessagesPerMinute: config.maxMessagesPerMinute,
      deduplicationWindow: config.deduplicationWindow,
    });
  }

  /**
   * Report an error to the Monitor API (fire-and-forget)
   * This method is non-blocking and will not throw errors.
   * Uses message queue with deduplication to prevent burst of Telegram messages.
   */
  reportError(message: string, options: ReportErrorOptions = {}): void {
    try {
      const appInfo = getAppInfo(this.config);

      const content: MonitorErrorContent = {
        error: message,
        prefix: options.prefix,
        timestamp: new Date().toISOString(),
        metadata: options.metadata,
      };

      // Add error details if provided
      if (options.error) {
        content.name = options.error.name;
        content.message = options.error.message;
        content.stack = options.error.stack;
        if (options.error.cause) {
          content.cause = String(options.error.cause);
        }
      }

      // Add additional arguments if provided
      if (options.args && options.args.length > 0) {
        content.args = options.args.map((arg) => {
          if (arg instanceof Error) {
            return {
              name: arg.name,
              message: arg.message,
              stack: arg.stack,
              cause: arg.cause ? String(arg.cause) : undefined,
            };
          }
          return arg;
        });
      }

      const report: MonitorErrorReport = {
        os: appInfo.os,
        appId: appInfo.appId,
        appVersion: appInfo.appVersion,
        content,
      };

      // Add to queue with deduplication
      this.queue.enqueue(report);
    } catch {
      // Silently ignore any errors - this is fire-and-forget
    }
  }

  /**
   * Report an error synchronously (returns a Promise)
   * Use this when you need to wait for the report to be sent.
   */
  async reportErrorAsync(
    message: string,
    options: ReportErrorOptions = {}
  ): Promise<{ success: boolean; requestId?: string }> {
    try {
      const appInfo = getAppInfo(this.config);

      const content: MonitorErrorContent = {
        error: message,
        prefix: options.prefix,
        timestamp: new Date().toISOString(),
        metadata: options.metadata,
      };

      if (options.error) {
        content.name = options.error.name;
        content.message = options.error.message;
        content.stack = options.error.stack;
        if (options.error.cause) {
          content.cause = String(options.error.cause);
        }
      }

      if (options.args && options.args.length > 0) {
        content.args = options.args.map((arg) => {
          if (arg instanceof Error) {
            return {
              name: arg.name,
              message: arg.message,
              stack: arg.stack,
              cause: arg.cause ? String(arg.cause) : undefined,
            };
          }
          return arg;
        });
      }

      const report: MonitorErrorReport = {
        os: appInfo.os,
        appId: appInfo.appId,
        appVersion: appInfo.appVersion,
        content,
      };

      const response = await fetch(`${this.baseUrl}/error`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(report),
      });

      const result = (await response.json()) as {
        success?: boolean;
        requestId?: string;
      };
      return {
        success: result.success ?? response.ok,
        requestId: result.requestId,
      };
    } catch {
      return { success: false };
    }
  }
}

// Default client instance
export const monitorClient = new MonitorClient();
